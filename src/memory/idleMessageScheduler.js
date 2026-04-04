'use strict';

const FileDatabase = require('../storage/fileDatabase');
const config = require('../config/config');
const { IDLE_THRESHOLDS, FRIEND_STAGES_FOR_IDLE } = require('../config/constants');
const { msSince, nowISO } = require('../utils/time');
const userMemory = require('./userMemory');
const relationshipEngine = require('./relationshipEngine');
const logger = require('../utils/logger').create('IdleScheduler');

const activityDb = new FileDatabase(config.paths.lastActivity, {});
const schedulerDb = new FileDatabase(config.paths.schedulerState, {});

let botInstance = null;
let intervalHandle = null;

/**
 * Idle message scheduler.
 * Monitors user inactivity and sends follow-up messages for friend-level relationships.
 * Checks every 5 minutes for eligible users.
 */

const IDLE_MESSAGES = {
  [IDLE_THRESHOLDS.FRIEND_1H]: "Hey, you still there? It's quiet without you.",
  [IDLE_THRESHOLDS.FRIEND_24H]: 'Did something happen? You went silent for a while.',
  [IDLE_THRESHOLDS.LONG_ABSENCE]: "It's been a long time... Where have you been?",
};

function init(bot) {
  botInstance = bot;
  intervalHandle = setInterval(checkIdleUsers, 5 * 60 * 1000); // Every 5 minutes
  logger.info('Idle message scheduler initialized');
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('Idle message scheduler stopped');
  }
}

function recordActivity(userId) {
  const data = activityDb.readAll();
  data[userId] = nowISO();
  activityDb.writeAll(data).catch((err) => {
    logger.error(`Failed to record activity for ${userId}`, { error: err.message });
  });
}

async function checkIdleUsers() {
  if (!botInstance) return;

  try {
    const allProfiles = userMemory.getAllProfiles();
    const schedulerState = schedulerDb.readAll();

    for (const [userId, profile] of Object.entries(allProfiles)) {
      const relation = relationshipEngine.getRelation(userId);

      if (!FRIEND_STAGES_FOR_IDLE.includes(relation.stage)) continue;
      if (relation.status !== 'open') continue;

      const lastActivity = activityDb.get(userId);
      const elapsed = msSince(lastActivity);

      const userState = schedulerState[userId] || { lastNotification: null, tier: 0 };

      // Determine which tier to send
      const thresholds = [
        IDLE_THRESHOLDS.FRIEND_1H,
        IDLE_THRESHOLDS.FRIEND_24H,
        IDLE_THRESHOLDS.LONG_ABSENCE,
      ];

      for (let i = userState.tier; i < thresholds.length; i++) {
        if (elapsed >= thresholds[i]) {
          const message = IDLE_MESSAGES[thresholds[i]];
          try {
            await botInstance.sendMessage(userId, message);
            logger.info(`Idle message sent to ${userId} (tier ${i})`);
            schedulerState[userId] = { lastNotification: nowISO(), tier: i + 1 };
          } catch (sendErr) {
            logger.warn(`Failed to send idle message to ${userId}`, { error: sendErr.message });
          }
          break; // Only send one tier at a time
        }
      }
    }

    await schedulerDb.writeAll(schedulerState);
  } catch (err) {
    logger.error('Idle check failed', { error: err.message });
  }
}

function resetUserIdleState(userId) {
  const schedulerState = schedulerDb.readAll();
  schedulerState[userId] = { lastNotification: null, tier: 0 };
  schedulerDb.writeAll(schedulerState).catch((err) => {
    logger.error(`Failed to reset idle state for ${userId}`, { error: err.message });
  });
}

module.exports = { init, stop, recordActivity, resetUserIdleState };
