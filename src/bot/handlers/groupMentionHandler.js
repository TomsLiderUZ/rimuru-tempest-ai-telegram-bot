'use strict';

const mentionService = require('../../services/mentionService');
const { isGroupChat } = require('../../utils/idUtils');
const logger = require('../../utils/logger').create('GroupMentionHandler');

/**
 * Group mention handler.
 * Determines if the bot should respond in a group chat.
 * Returns { shouldRespond: boolean, cleanedText: string }
 */

function evaluate(msg, botUserId) {
  if (!isGroupChat(msg)) {
    return { shouldRespond: true, cleanedText: msg.text || '' };
  }

  const text = msg.text || '';
  const replyTo = msg.reply_to_message || null;

  const mentioned = mentionService.isBotMentioned(text, replyTo, botUserId);

  if (!mentioned) {
    return { shouldRespond: false, cleanedText: '' };
  }

  const cleanedText = mentionService.stripMention(text);
  logger.debug(`Bot mentioned in group ${msg.chat.id}: "${cleanedText}"`);

  return { shouldRespond: true, cleanedText };
}

module.exports = { evaluate };
