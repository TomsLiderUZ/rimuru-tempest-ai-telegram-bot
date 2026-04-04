'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Centralized configuration module.
 * All environment variables and derived config are accessed through this single source of truth.
 * Secrets are validated at startup; missing required values cause immediate process exit.
 */

const REQUIRED_ENV = ['BOT_TOKEN', 'BOT_USERNAME'];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

/**
 * Collects all GROQ_API_KEY_* variables into an ordered array.
 * Supports any number of keys (GROQ_API_KEY_1, GROQ_API_KEY_2, ...).
 */
function collectGroqKeys() {
  const keys = [];
  let index = 1;
  while (process.env[`GROQ_API_KEY_${index}`]) {
    keys.push(process.env[`GROQ_API_KEY_${index}`]);
    index++;
  }
  if (keys.length === 0) {
    console.error('[FATAL] No GROQ_API_KEY_* environment variables found.');
    process.exit(1);
  }
  return keys;
}

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

const config = Object.freeze({
  // Telegram
  bot: {
    token: process.env.BOT_TOKEN,
    username: process.env.BOT_USERNAME,
    adminName: process.env.ADMIN_NAME || 'Admin',
    adminContactLink: process.env.ADMIN_CONTACT_LINK || '',
  },

  // AI / Groq
  ai: {
    keys: collectGroqKeys(),
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    maxRetries: 3,
    temperature: 0.85,
    maxTokens: 1024,
  },

  // Paths
  paths: {
    root: PROJECT_ROOT,
    data: DATA_DIR,
    privateChats: path.join(DATA_DIR, 'chats', 'private', 'usersChats.json'),
    groupChats: path.join(DATA_DIR, 'chats', 'groups', 'groupsChats.json'),
    usersMemory: path.join(DATA_DIR, 'users', 'usersMemory.json'),
    userRelations: path.join(DATA_DIR, 'relationships', 'userRelations.json'),
    lastActivity: path.join(DATA_DIR, 'meta', 'lastActivity.json'),
    schedulerState: path.join(DATA_DIR, 'meta', 'schedulerState.json'),
    prompts: path.join(PROJECT_ROOT, 'src', 'prompts'),
  },

  // General
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
});

module.exports = config;
