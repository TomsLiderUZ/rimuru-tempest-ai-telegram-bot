'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger').create('JsonReader');

/**
 * Safe JSON file reader with corruption recovery.
 * Returns parsed data or a default value on failure.
 */

function read(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      logger.info(`File not found, returning default: ${filePath}`);
      return structuredClone(defaultValue);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');

    if (!raw || raw.trim().length === 0) {
      logger.warn(`Empty file detected: ${filePath}`);
      return structuredClone(defaultValue);
    }

    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof SyntaxError) {
      logger.error(`JSON corruption detected in ${filePath}. Attempting backup recovery.`, {
        error: err.message,
      });
      return attemptBackupRecovery(filePath, defaultValue);
    }

    logger.error(`Failed to read file: ${filePath}`, { error: err.message });
    return structuredClone(defaultValue);
  }
}

/**
 * Tries to read from a .bak backup file if the primary file is corrupted.
 */
function attemptBackupRecovery(filePath, defaultValue) {
  const backupPath = filePath + '.bak';
  try {
    if (fs.existsSync(backupPath)) {
      const backupRaw = fs.readFileSync(backupPath, 'utf-8');
      const data = JSON.parse(backupRaw);
      logger.info(`Recovered from backup: ${backupPath}`);

      // Restore the primary file from backup
      fs.writeFileSync(filePath, backupRaw, 'utf-8');
      return data;
    }
  } catch (backupErr) {
    logger.error(`Backup recovery also failed for ${filePath}`, {
      error: backupErr.message,
    });
  }

  return structuredClone(defaultValue);
}

module.exports = { read };
