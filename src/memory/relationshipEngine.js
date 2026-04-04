'use strict';

const FileDatabase = require('../storage/fileDatabase');
const config = require('../config/config');
const { ALL_STAGES, USER_STATUS } = require('../config/constants');
const logger = require('../utils/logger').create('RelationshipEngine');

const relationDb = new FileDatabase(config.paths.userRelations, {});

/**
 * Relationship engine.
 * Updates user relationship stage and status based on AI-provided information blocks.
 * Validates stage transitions and persists changes.
 */

function getRelation(userId) {
  const rel = relationDb.get(userId);
  return rel || { stage: 'new', status: USER_STATUS.OPEN };
}

async function updateRelation(userId, stage, status) {
  if (stage && !ALL_STAGES.includes(stage)) {
    logger.warn(`Invalid stage rejected: "${stage}" for user ${userId}`);
    stage = undefined; // Keep existing
  }

  if (status && !Object.values(USER_STATUS).includes(status)) {
    logger.warn(`Invalid status rejected: "${status}" for user ${userId}`);
    status = undefined;
  }

  const current = getRelation(userId);
  const updated = {
    stage: stage || current.stage,
    status: status || current.status,
    updatedAt: new Date().toISOString(),
  };

  await relationDb.set(userId, updated);
  logger.info(`Relationship updated for ${userId}: stage=${updated.stage}, status=${updated.status}`);
  return updated;
}

function isBlocked(userId) {
  const rel = getRelation(userId);
  return rel.status === USER_STATUS.BLOCKED;
}

async function blockUser(userId) {
  await updateRelation(userId, 'blocked', USER_STATUS.BLOCKED);
  logger.warn(`User ${userId} has been BLOCKED`);
}

async function unblockUser(userId) {
  await updateRelation(userId, 'stranger', USER_STATUS.OPEN);
  logger.info(`User ${userId} has been UNBLOCKED`);
}

module.exports = { getRelation, updateRelation, isBlocked, blockUser, unblockUser };
