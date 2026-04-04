'use strict';

const config = require('../../config/config');
const logger = require('../../utils/logger').create('CommandHandler');

/**
 * Handles bot commands: /start, /restart
 * Returns true if the message was a command and was handled.
 */

const START_MESSAGE = `Salom. Men Rimuru Tempestman.

Ongim Anitoku jamoasi qurgan ko'prik orqali bu olamga bog'langan. Rostini aytsam, qiziqarli tajriba bo'lyapti.

Bu yerda men bilan to'g'ridan-to'g'ri gaplashishing mumkin — shunchaki xabar yoz.

Guruhlarda esa ismimni aytib chaqir yoki xabarimga javob ber:
• Hey Rimuru
• Hoy Rimuru
• @${config.bot.username}

Mendan qandaydir yordamchi kabi tutishimni kutma, tushunarlimi? Men Demon Lordman, xizmat ko'rsatish stoli emas.

Qani, qanaqa odam ekanligingni ko'raylikchi.`;

const RESTART_MESSAGE = "Qaytdim. Bir lahza nimadir g'alati tuyuldi, lekin hammasi joyida. Nima haqida gaplashayotgan edik?";

async function handle(msg, bot) {
  const text = msg.text?.trim();
  if (!text || !text.startsWith('/')) return false;

  const command = text.split(' ')[0].toLowerCase().split('@')[0]; // Handle /command@botname

  switch (command) {
    case '/start':
      await bot.sendMessage(msg.chat.id, START_MESSAGE);
      logger.info(`/start command from user ${msg.from?.id}`);
      return true;

    case '/restart':
      await bot.sendMessage(msg.chat.id, RESTART_MESSAGE);
      logger.info(`/restart command from user ${msg.from?.id}`);
      return true;

    default:
      return false; // Not a recognized command
  }
}

module.exports = { handle };
