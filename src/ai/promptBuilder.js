'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { ALL_STAGES, USER_STATUS } = require('../config/constants');
const logger = require('../utils/logger').create('PromptBuilder');

/**
 * Prompt builder module.
 * Assembles the full system prompt, developer prompt, behavior rules,
 * user context, and conversation history into a message array for Groq.
 */

let systemPromptCache = null;
let developerPromptCache = null;
let behaviorRulesCache = null;

function loadPromptFile(filename) {
  const filePath = path.join(config.paths.prompts, filename);
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (err) {
    logger.error(`Failed to load prompt file: ${filename}`, { error: err.message });
    return '';
  }
}

function getSystemPrompt() {
  if (!systemPromptCache) {
    systemPromptCache = loadPromptFile('systemPrompt.txt');
  }
  return systemPromptCache;
}

function getDeveloperPrompt() {
  if (!developerPromptCache) {
    developerPromptCache = loadPromptFile('developerPrompt.txt');
  }
  return developerPromptCache;
}

function getBehaviorRules() {
  if (!behaviorRulesCache) {
    behaviorRulesCache = loadPromptFile('behaviorRules.txt');
  }
  return behaviorRulesCache;
}

/**
 * Builds the full message array for the AI.
 *
 * @param {Object} userProfile - Current user profile from memory
 * @param {Object} relationship - Current relationship data
 * @param {Array} chatHistory - Recent chat history
 * @param {string} currentMessage - The user's current message
 * @param {boolean} isGroup - Whether this is a group chat
 * @returns {Array} Message array for Groq API
 */
function buildMessages(userProfile, relationship, chatHistory, currentMessage, isGroup = false) {
  const systemPrompt = getSystemPrompt();
  const developerPrompt = getDeveloperPrompt();
  const behaviorRules = getBehaviorRules();

  // Build context string about the user
  const userContext = buildUserContext(userProfile, relationship);
  const chatContext = isGroup ? 'This conversation is in a GROUP chat. Only respond when directly addressed.' : 'This is a PRIVATE chat.';

  const fullSystemPrompt = [
    systemPrompt,
    '',
    '--- DEVELOPER INSTRUCTIONS ---',
    developerPrompt,
    '',
    '--- BEHAVIOR RULES ---',
    behaviorRules,
    '',
    '--- CURRENT USER CONTEXT ---',
    userContext,
    '',
    chatContext,
    '',
    `--- VALID RELATIONSHIP STAGES ---`,
    `Positive: ${ALL_STAGES.filter(s => !['unpleasant', 'unnecessary', 'enemy', 'dangerous', 'blocked'].includes(s)).join(', ')}`,
    `Negative: unpleasant, unnecessary, enemy, dangerous, blocked`,
    `Valid status values: ${Object.values(USER_STATUS).join(', ')}`,
    '',
    '--- CRITICAL: RESPONSE FORMAT REMINDER ---',
    'Your response MUST start with the word "information" on its own line,',
    'followed by a JSON-like block in curly braces with status, stage, opinion, real_name, nickname.',
    'Then the word "message" on its own line, followed by your actual reply.',
    'Example:',
    '',
    'information',
    '{',
    '    status: "open",',
    '    stage: "stranger",',
    '    opinion: "New person. Observing.",',
    '    real_name: "Unknown",',
    '    nickname: "Unknown"',
    '}',
    '',
    'message',
    'Salom. Sen kimsan?',
    '',
    'ALWAYS follow this exact format. Never skip the information block.',
  ].join('\n');

  const messages = [
    { role: 'system', content: fullSystemPrompt },
  ];

  // Add conversation history
  for (const entry of chatHistory) {
    messages.push({
      role: entry.role === 'rimuru' ? 'assistant' : 'user',
      content: entry.content,
    });
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}

function buildUserContext(profile, relationship) {
  if (!profile) {
    return 'No prior interaction with this user.';
  }

  return [
    `Telegram ID: ${profile.telegram_id}`,
    `Username: ${profile.username}`,
    `Known real name: ${profile.real_name}`,
    `Nickname given: ${profile.nickname}`,
    `Relationship stage: ${relationship?.stage || profile.relationship_stage}`,
    `Status: ${relationship?.status || profile.status}`,
    `Your opinion: ${profile.opinion}`,
    `Friendship level: ${profile.friendship_level}`,
    `Notes: ${profile.notes || 'None'}`,
    `Last seen: ${profile.last_seen || 'First interaction'}`,
  ].join('\n');
}

/** Invalidate caches (useful if prompt files are hot-reloaded) */
function clearCaches() {
  systemPromptCache = null;
  developerPromptCache = null;
  behaviorRulesCache = null;
}

module.exports = { buildMessages, clearCaches };
