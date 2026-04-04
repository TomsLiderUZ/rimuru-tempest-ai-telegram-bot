'use strict';

/**
 * Application-wide constants.
 * Single source of truth for relationship stages, status values, and system defaults.
 */

const RELATIONSHIP_STAGES = Object.freeze({
  POSITIVE: [
    'new',
    'stranger',
    'familiar',
    'adherent',
    'partners',
    'friend',
    'thick_friend',
  ],
  NEGATIVE: [
    'unpleasant',
    'unnecessary',
    'enemy',
    'dangerous',
    'blocked',
  ],
});

const ALL_STAGES = Object.freeze([
  ...RELATIONSHIP_STAGES.POSITIVE,
  ...RELATIONSHIP_STAGES.NEGATIVE,
]);

const USER_STATUS = Object.freeze({
  OPEN: 'open',
  BLOCKED: 'blocked',
});

const IDLE_THRESHOLDS = Object.freeze({
  FRIEND_1H: 60 * 60 * 1000,           // 1 hour
  FRIEND_24H: 24 * 60 * 60 * 1000,     // 24 hours
  LONG_ABSENCE: 365 * 24 * 60 * 60 * 1000, // 1 year
});

const FRIEND_STAGES_FOR_IDLE = Object.freeze([
  'friend',
  'thick_friend',
]);

const MENTION_TRIGGERS = Object.freeze([
  'hey rimuru',
  'hoy rimuru',
  'salom rimuru',
]);

const BLOCK_MESSAGE = `
• Men bilan gaplashishing cheklangan. Admin bilan bog'lan. 

👮🏻 Admin: @anitoku_admin
🛠 Dasturchi: @Itz_Toms
`;

const UNSUPPORTED_MEDIA_MESSAGE = 'Bularni hali ko\'ra olmayman. Hozircha bu olam bilan aloqam faqat matnli xabarlarni qo\'llab-quvvatlaydi.';

const DEFAULT_USER_PROFILE = Object.freeze({
  telegram_id: null,
  username: 'Unknown',
  real_name: 'Unknown',
  nickname: 'Unknown',
  relationship_stage: 'new',
  status: USER_STATUS.OPEN,
  opinion: 'No opinion yet.',
  last_seen: null,
  friendship_level: 0,
  notes: '',
});

const AI_RESPONSE_REQUIRED_FIELDS = Object.freeze([
  'status',
  'stage',
  'opinion',
  'real_name',
  'nickname',
]);

const MAX_HISTORY_MESSAGES = 50;

module.exports = {
  RELATIONSHIP_STAGES,
  ALL_STAGES,
  USER_STATUS,
  IDLE_THRESHOLDS,
  FRIEND_STAGES_FOR_IDLE,
  MENTION_TRIGGERS,
  BLOCK_MESSAGE,
  UNSUPPORTED_MEDIA_MESSAGE,
  DEFAULT_USER_PROFILE,
  AI_RESPONSE_REQUIRED_FIELDS,
  MAX_HISTORY_MESSAGES,
};
