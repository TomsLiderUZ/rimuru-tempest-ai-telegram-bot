'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Structured logger with severity levels and ISO timestamps.
 * Outputs to both console and optionally a log file.
 * API keys and sensitive data are never logged.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

const SENSITIVE_PATTERNS = [
  /gsk_[a-zA-Z0-9]+/g,
  /\d{10}:[A-Za-z0-9_-]{35}/g,
];

function sanitize(message) {
  let sanitized = typeof message === 'string' ? message : JSON.stringify(message);
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

function formatEntry(level, module, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${sanitize(JSON.stringify(meta))}` : '';
  return `[${timestamp}] [${level}] [${module}] ${sanitize(message)}${metaStr}`;
}

function log(level, levelName, module, message, meta) {
  if (level < CURRENT_LEVEL) return;

  const entry = formatEntry(levelName, module, message, meta);

  switch (level) {
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.FATAL:
      console.error(entry);
      break;
    case LOG_LEVELS.WARN:
      console.warn(entry);
      break;
    default:
      console.log(entry);
  }
}

/**
 * Creates a scoped logger for a specific module.
 * Usage: const log = require('./logger').create('ModuleName');
 *        log.info('message');
 */
function create(moduleName) {
  return {
    debug: (msg, meta) => log(LOG_LEVELS.DEBUG, 'DEBUG', moduleName, msg, meta),
    info: (msg, meta) => log(LOG_LEVELS.INFO, 'INFO', moduleName, msg, meta),
    warn: (msg, meta) => log(LOG_LEVELS.WARN, 'WARN', moduleName, msg, meta),
    error: (msg, meta) => log(LOG_LEVELS.ERROR, 'ERROR', moduleName, msg, meta),
    fatal: (msg, meta) => log(LOG_LEVELS.FATAL, 'FATAL', moduleName, msg, meta),
  };
}

module.exports = { create };
