'use strict';

const logger = require('../utils/logger').create('ResponseParser');
const { validateAIResponse } = require('../utils/validation');

/**
 * Parses the strict AI response format:
 *
 * information
 * {
 *   status: "...",
 *   stage: "...",
 *   opinion: "...",
 *   real_name: "...",
 *   nickname: "..."
 * }
 *
 * message
 * <text>
 *
 * Returns { information: {...}, message: "..." } or null on failure.
 *
 * Multiple regex strategies are attempted to handle LLM formatting variations.
 */

function parse(rawResponse) {
  if (typeof rawResponse !== 'string' || rawResponse.trim().length === 0) {
    logger.error('Empty or non-string AI response received');
    return null;
  }

  try {
    const result = attemptParse(rawResponse);
    if (result) return result;

    logger.warn('All parse strategies failed for AI response');
    logger.debug(`Raw response preview: ${rawResponse.substring(0, 300)}`);
    return null;
  } catch (err) {
    logger.error('Unexpected error parsing AI response', { error: err.message });
    return null;
  }
}

function attemptParse(raw) {
  // Strategy 1: Standard format with "information" and "message" keywords
  // Handles various whitespace/newline combinations
  const patterns = [
    // Standard: information\n{...}\n\nmessage\n...
    /information\s*\n\s*\{([\s\S]*?)\}\s*\n\s*message\s*\n([\s\S]*)/i,
    // Compact: information{...}message\n...
    /information\s*\{([\s\S]*?)\}\s*message\s*\n?([\s\S]*)/i,
    // With colons: information:\n{...}\nmessage:\n...
    /information\s*:?\s*\n?\s*\{([\s\S]*?)\}\s*\n?\s*message\s*:?\s*\n([\s\S]*)/i,
    // With markdown code blocks: ```...```
    /information\s*\n?\s*```?\s*\{?([\s\S]*?)\}?\s*```?\s*\n?\s*message\s*\n?\s*([\s\S]*)/i,
    // Loose: just find the two blocks anywhere
    /information[\s\S]*?\{([\s\S]*?)\}[\s\S]*?message\s*[\n:]\s*([\s\S]*)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = raw.match(patterns[i]);
    if (match) {
      const rawInfo = match[1].trim();
      const messageBlock = match[2].trim();

      if (!messageBlock) continue;

      const information = parseInfoBlock(rawInfo);
      if (!information) continue;

      const parsed = { information, message: messageBlock };

      const validation = validateAIResponse(parsed);
      if (validation.valid) {
        logger.debug(`Successfully parsed with strategy ${i + 1}`);
        return parsed;
      } else {
        logger.debug(`Strategy ${i + 1} parsed but validation failed`, { errors: validation.errors });
      }
    }
  }

  // Strategy 2: Try to extract fields even without proper block structure
  return extractWithoutBlocks(raw);
}

/**
 * Parse the information block content into an object.
 * Handles JS-style object notation, JSON, and loose key:value pairs.
 */
function parseInfoBlock(rawBlock) {
  if (!rawBlock) return null;

  // Attempt 1: Direct JSON parse (if already valid JSON)
  try {
    return JSON.parse('{' + rawBlock + '}');
  } catch { /* continue */ }

  // Attempt 2: Normalize JS-style to JSON
  try {
    let normalized = '{' + rawBlock + '}';
    // Handle unquoted keys
    normalized = normalized.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    // Handle single-quoted values
    normalized = normalized.replace(/:\s*'([^']*)'/g, ': "$1"');
    // Handle unquoted string values (after colon, not a number/boolean)
    normalized = normalized.replace(/:\s*([^"'\d\[{}\][\s,][^,}\n]*)/g, (match, val) => {
      const trimmed = val.trim();
      if (['true', 'false', 'null'].includes(trimmed) || !isNaN(trimmed)) return match;
      return `: "${trimmed}"`;
    });
    // Remove trailing commas
    normalized = normalized.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(normalized);
  } catch { /* continue */ }

  // Attempt 3: Regex field extraction (most resilient)
  return extractFieldsFallback(rawBlock);
}

/**
 * Fallback field extractor using regex when JSON parsing fails.
 */
function extractFieldsFallback(rawBlock) {
  const fields = {};

  // Match patterns like: key: "value" or key: 'value' or key: value
  const lines = rawBlock.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*"?(\w+)"?\s*:\s*"?'?([^"'\n,}]+)"?'?\s*,?\s*$/);
    if (match) {
      fields[match[1].trim()] = match[2].trim();
    }
  }

  if (Object.keys(fields).length === 0) {
    // Try one more pattern for inline
    const inlinePattern = /(\w+)\s*:\s*["']?([^"',}\n]+)["']?/g;
    let match;
    while ((match = inlinePattern.exec(rawBlock)) !== null) {
      fields[match[1].trim()] = match[2].trim();
    }
  }

  if (Object.keys(fields).length === 0) {
    logger.debug('Field extraction found no fields');
    return null;
  }

  logger.debug(`Fallback extracted ${Object.keys(fields).length} fields`);
  return fields;
}

/**
 * Last resort: try to find required fields anywhere in the raw response
 * and extract the message portion.
 */
function extractWithoutBlocks(raw) {
  const fields = {};
  const requiredFields = ['status', 'stage', 'opinion', 'real_name', 'nickname'];

  for (const field of requiredFields) {
    const pattern = new RegExp(`${field}\\s*[:\\s]\\s*["']?([^"'\\n,}]+)["']?`, 'i');
    const match = raw.match(pattern);
    if (match) {
      fields[field] = match[1].trim();
    }
  }

  if (Object.keys(fields).length < 3) {
    return null; // Not enough fields found
  }

  // Try to find the message part - everything after the last field definition area
  const messageMatch = raw.match(/message\s*[:\n]\s*([\s\S]+)$/i);
  const message = messageMatch ? messageMatch[1].trim() : null;

  if (!message) return null;

  // Set defaults for missing fields
  fields.status = fields.status || 'open';
  fields.stage = fields.stage || 'new';
  fields.opinion = fields.opinion || 'No opinion yet.';
  fields.real_name = fields.real_name || 'Unknown';
  fields.nickname = fields.nickname || 'Unknown';

  const parsed = { information: fields, message };

  const validation = validateAIResponse(parsed);
  if (validation.valid) {
    logger.info('Extracted response using field-scan fallback');
    return parsed;
  }

  return null;
}

module.exports = { parse };
