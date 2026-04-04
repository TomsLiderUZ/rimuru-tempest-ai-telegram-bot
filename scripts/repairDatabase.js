'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Database repair utility.
 * Scans all JSON data files and attempts to repair corrupted ones
 * from their .bak backups. Run manually when data issues are detected.
 *
 * Usage: node scripts/repairDatabase.js
 */

const DATA_ROOT = path.resolve(__dirname, '..', 'data');

const DATA_FILES = [
  path.join(DATA_ROOT, 'chats', 'private', 'usersChats.json'),
  path.join(DATA_ROOT, 'chats', 'groups', 'groupsChats.json'),
  path.join(DATA_ROOT, 'users', 'usersMemory.json'),
  path.join(DATA_ROOT, 'relationships', 'userRelations.json'),
  path.join(DATA_ROOT, 'meta', 'lastActivity.json'),
  path.join(DATA_ROOT, 'meta', 'schedulerState.json'),
];

let repaired = 0;
let healthy = 0;
let unrecoverable = 0;

console.log('=== Database Repair Utility ===\n');

for (const filePath of DATA_FILES) {
  const relativePath = path.relative(DATA_ROOT, filePath);
  process.stdout.write(`Checking ${relativePath}... `);

  if (!fs.existsSync(filePath)) {
    console.log('MISSING → Creating empty file');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, '{}', 'utf-8');
    repaired++;
    continue;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(raw);
    console.log('OK');
    healthy++;
  } catch (parseErr) {
    console.log('CORRUPTED');

    const backupPath = filePath + '.bak';
    if (fs.existsSync(backupPath)) {
      try {
        const backupRaw = fs.readFileSync(backupPath, 'utf-8');
        JSON.parse(backupRaw); // Validate backup
        fs.writeFileSync(filePath, backupRaw, 'utf-8');
        console.log(`  → Restored from backup: ${relativePath}.bak`);
        repaired++;
      } catch {
        console.log(`  → Backup also corrupted. Resetting to empty object.`);
        fs.writeFileSync(filePath, '{}', 'utf-8');
        unrecoverable++;
      }
    } else {
      console.log(`  → No backup found. Resetting to empty object.`);
      fs.writeFileSync(filePath, '{}', 'utf-8');
      unrecoverable++;
    }
  }
}

console.log(`\n=== Repair Complete ===`);
console.log(`Healthy: ${healthy}`);
console.log(`Repaired: ${repaired}`);
console.log(`Reset (data lost): ${unrecoverable}`);
