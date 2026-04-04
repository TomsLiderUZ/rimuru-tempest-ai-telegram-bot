'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger').create('JsonWriter');

/**
 * Atomic JSON file writer.
 * Uses write-to-temp-then-rename strategy to prevent corruption.
 * Creates directories and backup files automatically.
 */

/** Write lock map to prevent concurrent writes to the same file */
const writeLocks = new Map();

async function write(filePath, data) {
  // Serialize early to catch JSON errors before touching the file system
  const serialized = JSON.stringify(data, null, 2);

  // Wait for any in-flight write to the same path
  while (writeLocks.get(filePath)) {
    await writeLocks.get(filePath);
  }

  let resolve;
  const lockPromise = new Promise((r) => { resolve = r; });
  writeLocks.set(filePath, lockPromise);

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create backup of existing file
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, filePath + '.bak');
      } catch (backupErr) {
        logger.warn(`Could not create backup for ${filePath}`, { error: backupErr.message });
      }
    }

    // Atomic write: write to temp file, then rename
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    fs.renameSync(tempPath, filePath);

    logger.debug(`Successfully wrote: ${filePath}`);
  } catch (err) {
    logger.error(`Failed to write file: ${filePath}`, { error: err.message });
    throw err;
  } finally {
    writeLocks.delete(filePath);
    resolve();
  }
}

module.exports = { write };
