'use strict';

const logger = require('../../utils/logger').create('LanguageDetector');

/**
 * Middleware: basic language detection from message text.
 * Used to log detected language. The AI itself handles language matching
 * through the system prompt, but this provides analytics capability.
 *
 * Future expansion: integrate with a proper language detection library.
 */

const CYRILLIC_PATTERN = /[\u0400-\u04FF]/;
const CJK_PATTERN = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
const ARABIC_PATTERN = /[\u0600-\u06FF]/;
const LATIN_PATTERN = /[a-zA-Z]/;

function detect(text) {
  if (!text || typeof text !== 'string') return 'unknown';

  if (CYRILLIC_PATTERN.test(text)) return 'cyrillic'; // Russian, Uzbek Cyrillic, etc.
  if (CJK_PATTERN.test(text)) return 'cjk';          // Chinese, Japanese, Korean
  if (ARABIC_PATTERN.test(text)) return 'arabic';
  if (LATIN_PATTERN.test(text)) return 'latin';       // English, Uzbek Latin, etc.

  return 'other';
}

module.exports = { detect };
