'use strict';

/**
 * Application entry point.
 * Initializes data directories, then starts the bot.
 */

const logger = require('./utils/logger').create('Main');

/* ===============================
   KEEP ALIVE SERVER (Render ping)
================================= */
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Rimuru Tempest Bot is alive');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'Rimuru Tempest',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.listen(PORT, () => {
  logger.info(`Keep-alive server running on port ${PORT}`);
});

/* ===============================
   MAIN BOT START
================================= */

async function main() {
  logger.info('=== Rimuru Tempest AI Bot Starting ===');
  logger.info(`Node.js ${process.version}`);

  // Initialize data folders before anything else
  try {
    require('../scripts/initDataFolders');
    logger.info('Data directories initialized');
  } catch (err) {
    logger.fatal('Failed to initialize data directories', { error: err.message });
    process.exit(1);
  }

  // Start the bot
  try {
    const bot = require('./bot/bot');
    await bot.start();
    logger.info('=== Rimuru Tempest AI Bot is LIVE ===');
  } catch (err) {
    logger.fatal('Failed to start bot', { error: err.message });
    process.exit(1);
  }
}

// Handle unhandled rejections globally
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

main();