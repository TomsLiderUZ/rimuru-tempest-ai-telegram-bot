'use strict';

const FileDatabase = require('../storage/fileDatabase');
const config = require('../config/config');
const { MAX_HISTORY_MESSAGES } = require('../config/constants');
const { nowISO } = require('../utils/time');
const logger = require('../utils/logger').create('ChatMemory');

const privateChatDb = new FileDatabase(config.paths.privateChats, {});
const groupChatDb = new FileDatabase(config.paths.groupChats, {});

/**
 * Chat memory module.
 * Stores and retrieves conversation history per user (private) or per group.
 * History is automatically trimmed to MAX_HISTORY_MESSAGES to prevent unbounded growth.
 */

function getHistory(chatId, isGroup = false) {
  const db = isGroup ? groupChatDb : privateChatDb;
  const history = db.get(chatId);
  return Array.isArray(history) ? history : [];
}

async function addMessage(chatId, role, content, isGroup = false) {
  const db = isGroup ? groupChatDb : privateChatDb;
  const history = getHistory(chatId, isGroup);

  history.push({
    role,
    content,
    timestamp: nowISO(),
  });

  // Trim to prevent unbounded file growth
  const trimmed = history.length > MAX_HISTORY_MESSAGES
    ? history.slice(-MAX_HISTORY_MESSAGES)
    : history;

  await db.set(chatId, trimmed);
  logger.debug(`Message stored for chat ${chatId} (${role})`);
}

function getRecentHistory(chatId, limit = 20, isGroup = false) {
  const history = getHistory(chatId, isGroup);
  return history.slice(-limit);
}

async function clearHistory(chatId, isGroup = false) {
  const db = isGroup ? groupChatDb : privateChatDb;
  await db.set(chatId, []);
  logger.info(`Chat history cleared for ${chatId}`);
}

module.exports = { getHistory, addMessage, getRecentHistory, clearHistory };
