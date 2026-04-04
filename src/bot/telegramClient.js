'use strict';

const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const logger = require('../utils/logger').create('TelegramClient');

/**
 * Telegram bot client factory.
 * Creates and configures the node-telegram-bot-api instance.
 * Isolated to allow future transport switching.
 */

function create() {
  const bot = new TelegramBot(config.bot.token, {
    polling: {
      interval: 500,
      autoStart: false,
      params: {
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      },
    },
  });

  // Global error handlers to prevent unhandled rejections
  bot.on('polling_error', (err) => {
    logger.error('Telegram polling error', {
      code: err.code,
      message: err.message,
    });
  });

  bot.on('error', (err) => {
    logger.error('Telegram client error', { message: err.message });
  });

  logger.info('Telegram client created');
  return bot;
}

module.exports = { create };
