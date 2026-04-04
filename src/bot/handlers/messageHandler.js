'use strict';

const chatService = require('../../services/chatService');
const { extractUserId, extractUsername, extractChatId, isPrivateChat, isGroupChat } = require('../../utils/idUtils');
const blockCheck = require('../middleware/blockCheck');
const fileFilter = require('../middleware/fileFilter');
const commandHandler = require('./commandHandler');
const groupMentionHandler = require('./groupMentionHandler');
const languageDetector = require('../middleware/languageDetector');
const logger = require('../../utils/logger').create('MessageHandler');

/**
 * Central message handler — the main entry point for all incoming messages.
 * Runs through middleware pipeline, then routes to appropriate processing.
 */

async function handle(msg, bot, botUserId) {
  const userId = extractUserId(msg);
  const chatId = extractChatId(msg);

  if (!userId || !chatId) {
    logger.warn('Message received with missing user/chat ID');
    return;
  }

  try {
    // 1. Block check middleware
    const blocked = await blockCheck.check(msg, bot);
    if (blocked) return;

    // 2. File/media filter middleware
    const isMedia = await fileFilter.check(msg, bot);
    if (isMedia) return;

    // 3. Skip non-text messages that passed the filter
    if (!msg.text) return;

    // 4. Command handler
    const isCommand = await commandHandler.handle(msg, bot);
    if (isCommand) return;

    // 5. Group mention check
    const isGroup = isGroupChat(msg);
    let textToProcess = msg.text;

    if (isGroup) {
      const { shouldRespond, cleanedText } = groupMentionHandler.evaluate(msg, botUserId);
      if (!shouldRespond) return; // Not mentioned in group — ignore
      textToProcess = cleanedText;
    }

    // 6. Language detection (analytics / logging)
    const detectedScript = languageDetector.detect(textToProcess);
    logger.debug(`Processing message from ${userId} (script: ${detectedScript})`);

    // 7. Send typing indicator
    try {
      await bot.sendChatAction(chatId, 'typing');
    } catch {
      // Non-critical failure
    }

    // 8. Process through chat service
    const username = extractUsername(msg);
    const response = await chatService.processMessage(userId, username, textToProcess, isGroup);

    // 9. Send response
    await bot.sendMessage(chatId, response);
    logger.info(`Response sent to ${userId} in chat ${chatId}`);

  } catch (err) {
    logger.error(`Error processing message from ${userId}`, { error: err.message });
    try {
      await bot.sendMessage(chatId, "Hmm, menda nimadir xato ketdi shekilli. Biroz kutib, yana urinib ko'rchi.");
    } catch (sendErr) {
      logger.error('Failed to send error fallback message', { error: sendErr.message });
    }
  }
}

module.exports = { handle };
