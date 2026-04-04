'use strict';

const logger = require('../utils/logger').create('MemoryAnalyzer');

/**
 * Analyzes information blocks from AI responses to update user memory.
 * Extracts and returns profile update fields.
 */

function extractProfileUpdates(informationBlock) {
  if (!informationBlock || typeof informationBlock !== 'object') {
    return null;
  }

  const updates = {};

  if (informationBlock.real_name && informationBlock.real_name !== 'Unknown') {
    updates.real_name = informationBlock.real_name;
  }

  if (informationBlock.nickname && informationBlock.nickname !== 'Unknown') {
    updates.nickname = informationBlock.nickname;
  }

  if (informationBlock.opinion) {
    updates.opinion = informationBlock.opinion;
  }

  if (informationBlock.stage) {
    updates.relationship_stage = informationBlock.stage;
  }

  if (informationBlock.status) {
    updates.status = informationBlock.status;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

module.exports = { extractProfileUpdates };
