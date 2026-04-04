'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Data directory initializer.
 * Creates all required directories and empty JSON files if they don't exist.
 * Safe to run multiple times (idempotent).
 */

const DATA_ROOT = path.resolve(__dirname, '..', 'data');

const DIRECTORIES = [
  path.join(DATA_ROOT, 'chats', 'private'),
  path.join(DATA_ROOT, 'chats', 'groups'),
  path.join(DATA_ROOT, 'users'),
  path.join(DATA_ROOT, 'relationships'),
  path.join(DATA_ROOT, 'meta'),
];

const FILES = [
  { path: path.join(DATA_ROOT, 'chats', 'private', 'usersChats.json'), default: {} },
  { path: path.join(DATA_ROOT, 'chats', 'groups', 'groupsChats.json'), default: {} },
  { path: path.join(DATA_ROOT, 'users', 'usersMemory.json'), default: {} },
  { path: path.join(DATA_ROOT, 'relationships', 'userRelations.json'), default: {} },
  { path: path.join(DATA_ROOT, 'meta', 'lastActivity.json'), default: {} },
  { path: path.join(DATA_ROOT, 'meta', 'schedulerState.json'), default: {} },
];

// Create directories
for (const dir of DIRECTORIES) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[INIT] Created directory: ${dir}`);
  }
}

// Create files with default content
for (const file of FILES) {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, JSON.stringify(file.default, null, 2), 'utf-8');
    console.log(`[INIT] Created file: ${file.path}`);
  }
}

console.log('[INIT] Data initialization complete');
