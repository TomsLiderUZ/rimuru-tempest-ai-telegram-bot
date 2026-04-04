'use strict';

const mentionService = require('../../services/mentionService');
const logger = require('../../utils/logger').create('ReplyHandler');

/**
 * Reply handler.
 * Detects when a user replies to the bot's message in a group.
 * Returns true if the reply is directed at the bot.
 */

function isReplyToBot(msg, botUserId) {
  if (!msg.reply_to_message) return false;
  return String(msg.reply_to_message.from?.id) === String(botUserId);
}

module.exports = { isReplyToBot };
