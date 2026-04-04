'use strict';

const Groq = require('groq-sdk');
const config = require('../config/config');
const logger = require('../utils/logger').create('AIClient');

/**
 * Groq API client with automatic key rotation.
 * Sequences through available API keys when rate limits are hit.
 * Prevents infinite retry loops with a max-attempts guard.
 */

let currentKeyIndex = 0;
const keys = config.ai.keys;

function getClient() {
  return new Groq({ apiKey: keys[currentKeyIndex] });
}

function rotateKey(reason) {
  const prevIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  logger.warn(`API key rotated from index ${prevIndex} → ${currentKeyIndex}. Reason: ${reason}`);
}

/**
 * Sends a chat completion request to Groq.
 * Automatically retries with rotated keys on rate limit (429) or server errors (5xx).
 * @param {Array} messages - OpenAI-compatible message array
 * @returns {string} The assistant response content
 */
async function complete(messages) {
  const maxAttempts = Math.min(keys.length * 2, config.ai.maxRetries * keys.length);
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: config.ai.model,
        messages,
        temperature: config.ai.temperature,
        max_tokens: config.ai.maxTokens,
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response content from Groq API');
      }

      return content;
    } catch (err) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || 0;

      if (statusCode === 429) {
        logger.warn(`Rate limit hit on key index ${currentKeyIndex}. Rotating.`);
        rotateKey('rate_limit');
        continue;
      }

      if (statusCode >= 500) {
        logger.warn(`Server error (${statusCode}) on key index ${currentKeyIndex}. Rotating.`);
        rotateKey('server_error');
        continue;
      }

      // For other errors (auth, invalid request, etc.), don't retry same key
      if (statusCode === 401 || statusCode === 403) {
        logger.error(`Authentication error on key index ${currentKeyIndex}. Rotating.`);
        rotateKey('auth_error');
        continue;
      }

      // Unexpected error — break to avoid silent loops
      logger.error('Unexpected AI client error', { error: err.message, status: statusCode });
      break;
    }
  }

  const msg = lastError?.message || 'All API keys exhausted';
  logger.error(`AI completion failed after all attempts: ${msg}`);
  throw new Error(`AI completion failed: ${msg}`);
}

module.exports = { complete };
