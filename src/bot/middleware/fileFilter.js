'use strict';

const { UNSUPPORTED_MEDIA_MESSAGE } = require('../../config/constants');
const logger = require('../../utils/logger').create('FileFilterMiddleware');

/**
 * Middleware: detects non-text messages (images, audio, video, files)
 * and responds with an appropriate message. Returns true if handled.
 *
 * Future expansion: this is the hook point for image/voice processing.
 */

function isMediaMessage(msg) {
  return !!(
    msg.photo ||
    msg.video ||
    msg.audio ||
    msg.voice ||
    msg.document ||
    msg.sticker ||
    msg.video_note ||
    msg.animation
  );
}

async function check(msg, bot) {
  if (isMediaMessage(msg)) {
    logger.debug(`Media message received from ${msg.from?.id}, type: ${getMediaType(msg)}`);
    try {
      await bot.sendMessage(msg.chat.id, UNSUPPORTED_MEDIA_MESSAGE);
    } catch (err) {
      logger.error('Failed to send unsupported media message', { error: err.message });
    }
    return true; // Handled — don't process further
  }
  return false;
}

function getMediaType(msg) {
  if (msg.photo) return 'photo';
  if (msg.video) return 'video';
  if (msg.audio) return 'audio';
  if (msg.voice) return 'voice';
  if (msg.document) return 'document';
  if (msg.sticker) return 'sticker';
  if (msg.video_note) return 'video_note';
  if (msg.animation) return 'animation';
  return 'unknown';
}

module.exports = { check, isMediaMessage };
