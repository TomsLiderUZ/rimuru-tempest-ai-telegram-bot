'use strict';

const userMemory = require('../memory/userMemory');
const relationshipEngine = require('../memory/relationshipEngine');
const logger = require('../utils/logger').create('UserService');

/**
 * User service — orchestrates user profile and relationship operations.
 * Provides a clean interface for handlers to work with user data.
 */

function getFullUserData(userId, username) {
  const profile = userMemory.getOrCreateProfile(userId, username);
  const relationship = relationshipEngine.getRelation(userId);
  return { profile, relationship };
}

async function updateUserFromAI(userId, username, informationBlock) {
  // Update profile
  const profileUpdates = {};
  if (informationBlock.real_name) profileUpdates.real_name = informationBlock.real_name;
  if (informationBlock.nickname) profileUpdates.nickname = informationBlock.nickname;
  if (informationBlock.opinion) profileUpdates.opinion = informationBlock.opinion;
  if (informationBlock.stage) profileUpdates.relationship_stage = informationBlock.stage;
  if (informationBlock.status) profileUpdates.status = informationBlock.status;
  profileUpdates.username = username;

  await userMemory.updateProfile(userId, profileUpdates);

  // Update relationship
  await relationshipEngine.updateRelation(
    userId,
    informationBlock.stage,
    informationBlock.status
  );

  logger.debug(`User data updated from AI response for ${userId}`);
}

function isUserBlocked(userId) {
  return relationshipEngine.isBlocked(userId);
}

module.exports = { getFullUserData, updateUserFromAI, isUserBlocked };
