'use strict';

/**
 * Time utilities for consistent timestamp handling across the system.
 */

function nowISO() {
  return new Date().toISOString();
}

function msSince(isoString) {
  if (!isoString) return Infinity;
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return Infinity;
  return Date.now() - then;
}

function humanDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'unknown';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

module.exports = { nowISO, msSince, humanDuration };
