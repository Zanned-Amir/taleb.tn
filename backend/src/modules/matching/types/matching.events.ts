// Matching Gateway Events
export const MATCHING_EVENTS = {
  // Client to Server
  start_matching: 'start-matching',
  cancel_matching: 'cancel-matching',
  end_match: 'end-match',

  // Server to Client
  match_found: 'match-found',
  matching_status: 'matching-status',
  matching_cancelled: 'matching-cancelled',
  match_ended: 'match-ended',
  matching_error: 'matching-error',
} as const;

export type MatchingEvent =
  (typeof MATCHING_EVENTS)[keyof typeof MATCHING_EVENTS];
