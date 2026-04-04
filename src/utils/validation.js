'use strict';

const { ALL_STAGES, USER_STATUS, AI_RESPONSE_REQUIRED_FIELDS } = require('../config/constants');

/**
 * Validation utilities for AI response and data integrity.
 */

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidStatus(status) {
  return Object.values(USER_STATUS).includes(status);
}

function isValidStage(stage) {
  return ALL_STAGES.includes(stage);
}

/**
 * Validates the parsed information block from an AI response.
 * Returns { valid: boolean, errors: string[] }
 */
function validateInformationBlock(info) {
  const errors = [];

  if (!info || typeof info !== 'object') {
    return { valid: false, errors: ['Information block is not an object'] };
  }

  for (const field of AI_RESPONSE_REQUIRED_FIELDS) {
    if (!isNonEmptyString(info[field])) {
      errors.push(`Missing or empty required field: "${field}"`);
    }
  }

  if (info.status && !isValidStatus(info.status)) {
    errors.push(`Invalid status value: "${info.status}". Expected: ${Object.values(USER_STATUS).join(', ')}`);
  }

  if (info.stage && !isValidStage(info.stage)) {
    errors.push(`Invalid stage value: "${info.stage}". Expected one of: ${ALL_STAGES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Full AI response structure validation.
 * Expects { information: {...}, message: "..." }
 */
function validateAIResponse(parsed) {
  const errors = [];

  if (!parsed) {
    return { valid: false, errors: ['Parsed response is null or undefined'] };
  }

  if (!parsed.information) {
    errors.push('Missing "information" block');
  } else {
    const infoResult = validateInformationBlock(parsed.information);
    if (!infoResult.valid) {
      errors.push(...infoResult.errors);
    }
  }

  if (!isNonEmptyString(parsed.message)) {
    errors.push('Missing or empty "message" block');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  isNonEmptyString,
  isValidStatus,
  isValidStage,
  validateInformationBlock,
  validateAIResponse,
};
