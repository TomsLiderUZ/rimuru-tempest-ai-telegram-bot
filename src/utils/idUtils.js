'use strict';

/**
 * Identity utilities for safe Telegram user identification.
 * All identification relies on Telegram numeric ID, never on username.
 */

function extractUserId(msg) {
  return msg?.from?.id ? String(msg.from.id) : null;
}

function extractUsername(msg) {
  return msg?.from?.username || 'Unknown';
}

function extractChatId(msg) {
  return msg?.chat?.id ? String(msg.chat.id) : null;
}

function isPrivateChat(msg) {
  return msg?.chat?.type === 'private';
}

function isGroupChat(msg) {
  return msg?.chat?.type === 'group' || msg?.chat?.type === 'supergroup';
}

module.exports = { extractUserId, extractUsername, extractChatId, isPrivateChat, isGroupChat };
