'use strict';

const telegramClient = require('./telegramClient');
const messageHandler = require('./handlers/messageHandler');
const idleScheduler = require('../memory/idleMessageScheduler');
const logger = require('../utils/logger').create('Bot');

/**
 * Bot bootstrapper.
 * Creates the Telegram client, registers event listeners,
 * starts polling, and initializes the idle scheduler.
 */

let botUserId = null;

async function start() {
  const bot = telegramClient.create();

  // Get bot's own user ID for reply detection
  try {
    const me = await bot.getMe();
    botUserId = String(me.id);
    logger.info(`Bot identity confirmed: @${me.username} (ID: ${botUserId})`);
  } catch (err) {
    logger.fatal('Failed to retrieve bot identity. Check BOT_TOKEN.', { error: err.message });
    process.exit(1);
  }

  // Register message listener
  bot.on('message', async (msg) => {
    try {
      await messageHandler.handle(msg, bot, botUserId);
    } catch (err) {
      logger.error('Unhandled error in message handler', { error: err.message });
    }
  });

  // Initialize idle message scheduler
  idleScheduler.init(bot);

  // Start polling
  await bot.startPolling();
  logger.info('Bot is now polling for messages');

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    idleScheduler.stop();
    await bot.stopPolling();
    logger.info('Bot stopped');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return bot;
}

module.exports = { start };
