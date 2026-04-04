'use strict';

/**
 * Text processing utilities for message normalization and analysis.
 */

function normalizeWhitespace(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

function truncate(text, maxLength = 200) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function containsAny(text, patterns) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

module.exports = { normalizeWhitespace, truncate, escapeMarkdown, containsAny };
