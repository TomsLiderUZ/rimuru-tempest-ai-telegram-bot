'use strict';

const blockService = require('../../services/blockService');
const { extractUserId } = require('../../utils/idUtils');
const logger = require('../../utils/logger').create('BlockCheckMiddleware');

/**
 * Middleware: checks if user is blocked before processing their message.
 * Returns true if blocked (message should NOT be processed further).
 */

async function check(msg, bot) {
  const userId = extractUserId(msg);
  if (!userId) return false;

  if (blockService.isBlocked(userId)) {
    logger.info(`Blocked user attempted to message: ${userId}`);
    try {
      await bot.sendMessage(msg.chat.id, blockService.getBlockMessage());
    } catch (err) {
      logger.error('Failed to send block message', { error: err.message });
    }
    return true; // Blocked
  }

  return false; // Not blocked
}

module.exports = { check };
