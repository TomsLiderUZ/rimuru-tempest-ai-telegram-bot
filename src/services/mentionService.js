'use strict';

const config = require('../config/config');
const { MENTION_TRIGGERS } = require('../config/constants');
const { containsAny } = require('../utils/textUtils');
const logger = require('../utils/logger').create('MentionService');

/**
 * Mention detection service for group chats.
 * Detects if the bot is being addressed via name triggers or @username.
 */

function isBotMentioned(text, replyToMessage, botUserId) {
  if (!text && !replyToMessage) return false;

  // Check if replying to the bot's own message
  if (replyToMessage?.from?.id && String(replyToMessage.from.id) === String(botUserId)) {
    return true;
  }

  if (!text) return false;

  // Check @username mention
  const botMention = `@${config.bot.username}`;
  if (text.toLowerCase().includes(botMention.toLowerCase())) {
    return true;
  }

  // Check natural language triggers
  if (containsAny(text, MENTION_TRIGGERS)) {
    return true;
  }

  return false;
}

/**
 * Strips the mention/trigger from the message text so the AI receives clean input.
 */
function stripMention(text) {
  if (!text) return '';

  let cleaned = text;

  // Remove @username
  const botMention = `@${config.bot.username}`;
  cleaned = cleaned.replace(new RegExp(botMention, 'gi'), '').trim();

  // Remove trigger phrases
  for (const trigger of MENTION_TRIGGERS) {
    cleaned = cleaned.replace(new RegExp(trigger, 'gi'), '').trim();
  }

  return cleaned || text; // Return original if stripping empties it
}

module.exports = { isBotMentioned, stripMention };
