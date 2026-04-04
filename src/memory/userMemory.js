'use strict';

const FileDatabase = require('../storage/fileDatabase');
const config = require('../config/config');
const { DEFAULT_USER_PROFILE } = require('../config/constants');
const { nowISO } = require('../utils/time');
const logger = require('../utils/logger').create('UserMemory');

const userDb = new FileDatabase(config.paths.usersMemory, {});

/**
 * User memory module.
 * Manages persistent user profiles with dynamic relationship data.
 * Always uses Telegram numeric ID as the key.
 */

function getProfile(userId) {
  const profile = userDb.get(userId);
  if (!profile) return null;
  return { ...DEFAULT_USER_PROFILE, ...profile };
}

function getOrCreateProfile(userId, username = 'Unknown') {
  let profile = getProfile(userId);
  if (!profile) {
    profile = {
      ...DEFAULT_USER_PROFILE,
      telegram_id: userId,
      username,
      last_seen: nowISO(),
    };
    logger.info(`Created new user profile: ${userId}`);
  }
  return profile;
}

async function saveProfile(userId, profile) {
  profile.last_seen = nowISO();
  await userDb.set(userId, profile);
  logger.debug(`Profile saved for user ${userId}`);
}

async function updateProfile(userId, updates) {
  const current = getOrCreateProfile(userId);
  const merged = { ...current, ...updates, last_seen: nowISO() };
  await userDb.set(userId, merged);
  return merged;
}

function getAllProfiles() {
  return userDb.readAll();
}

module.exports = { getProfile, getOrCreateProfile, saveProfile, updateProfile, getAllProfiles };
