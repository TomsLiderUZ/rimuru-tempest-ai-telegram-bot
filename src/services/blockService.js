'use strict';

const relationshipEngine = require('../memory/relationshipEngine');
const { BLOCK_MESSAGE } = require('../config/constants');
const logger = require('../utils/logger').create('BlockService');

/**
 * Block service — manages user blocking operations.
 * All blocking is based on Telegram numeric ID, never username.
 */

function isBlocked(userId) {
  return relationshipEngine.isBlocked(userId);
}

async function blockUser(userId, reason = 'Unspecified') {
  await relationshipEngine.blockUser(userId);
  logger.warn(`User ${userId} blocked. Reason: ${reason}`);
}

async function unblockUser(userId) {
  await relationshipEngine.unblockUser(userId);
  logger.info(`User ${userId} unblocked`);
}

function getBlockMessage() {
  return BLOCK_MESSAGE;
}

module.exports = { isBlocked, blockUser, unblockUser, getBlockMessage };
