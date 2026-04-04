'use strict';

const aiClient = require('../ai/aiClient');
const promptBuilder = require('../ai/promptBuilder');
const responseParser = require('../ai/responseParser');
const chatMemory = require('../memory/chatMemory');
const userService = require('./userService');
const idleScheduler = require('../memory/idleMessageScheduler');
const logger = require('../utils/logger').create('ChatService');

const MAX_REGEN_ATTEMPTS = 3;

/**
 * Chat service — the main orchestrator for processing a user message.
 * 1. Loads user data and chat history
 * 2. Builds the prompt
 * 3. Calls AI with retry on malformed responses
 * 4. Parses and validates the response
 * 5. Updates memory and returns the message
 */

async function processMessage(userId, username, textContent, isGroup = false) {
  // 1. Load user context
  const { profile, relationship } = userService.getFullUserData(userId, username);
  const chatHistory = chatMemory.getRecentHistory(userId, 20, isGroup);

  // 2. Record activity for idle tracking
  idleScheduler.recordActivity(userId);
  idleScheduler.resetUserIdleState(userId);

  // 3. Store user message
  await chatMemory.addMessage(userId, 'user', textContent, isGroup);

  // 4. Build prompt and call AI (with regeneration on parse failure)
  let parsed = null;
  let attempts = 0;

  while (!parsed && attempts < MAX_REGEN_ATTEMPTS) {
    attempts++;
    try {
      const messages = promptBuilder.buildMessages(
        profile,
        relationship,
        chatHistory,
        textContent,
        isGroup
      );

      const rawResponse = await aiClient.complete(messages);
      logger.debug(`AI raw response (attempt ${attempts}): ${rawResponse.substring(0, 200)}...`);

      parsed = responseParser.parse(rawResponse);

      if (!parsed) {
        logger.warn(`AI response parse failed on attempt ${attempts}/${MAX_REGEN_ATTEMPTS}. Regenerating.`);
      }
    } catch (err) {
      logger.error(`AI call failed on attempt ${attempts}`, { error: err.message });
      if (attempts >= MAX_REGEN_ATTEMPTS) {
        throw new Error('Failed to get a valid response from AI after maximum attempts');
      }
    }
  }

  if (!parsed) {
    throw new Error('AI response validation failed after all regeneration attempts');
  }

  // 5. Update user data from AI information block
  try {
    await userService.updateUserFromAI(userId, username, parsed.information);
  } catch (updateErr) {
    // Non-critical — log but don't fail the response
    logger.error('Failed to update user data from AI response', { error: updateErr.message });
  }

  // 6. Store AI response in chat history
  await chatMemory.addMessage(userId, 'rimuru', parsed.message, isGroup);

  return parsed.message;
}

module.exports = { processMessage };
