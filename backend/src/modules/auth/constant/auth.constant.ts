// src/modules/auth/constants/auth.constants.ts

const SALT_ROUNDS = 10;

// Cookie expirations
const EXPIRED_COOKIE_ACCESS = 1000 * 60 * 15; // 15 minutes (more secure)
const EXPIRED_COOKIE_REFRESH = 1000 * 60 * 60 * 24 * 7; // 7 days

// Email confirmation - 24 hours is standard
const EXPIRED_CONFIRM_EMAIL = 1000 * 60 * 60 * 24; // 24 hours

const EXPIRED_CHANGE_EMAIL = 1000 * 60 * 15; // 15 minutes

// Password reset magic link - 15 minutes is good
const EXPIRED_RESET_PASSWORD = 1000 * 60 * 15; // 15 minutes

// OTP expirations - should be SHORT
const EXPIRED_OTP_EMAIL = 1000 * 60 * 5; // 5 minutes (was 15)
const EXPIRED_OTP_SMS = 1000 * 60 * 5; // 5 minutes

// TOTP settings - for code generation
const TOTP_PERIOD = 30; // 30 seconds - how often code changes
const TOTP_WINDOW = 1; // Allow 1 step before/after for clock drift

const SECURITY_TIPS = [
  'Use a strong password with a mix of uppercase, lowercase, numbers, and symbols',
  'Never share your password with anyone, including support staff',
  'Avoid using easily guessable information like birthdate or names',
  'Consider enabling two-factor authentication for extra security',
];

export {
  SALT_ROUNDS,
  EXPIRED_COOKIE_ACCESS,
  EXPIRED_COOKIE_REFRESH,
  EXPIRED_CONFIRM_EMAIL,
  EXPIRED_CHANGE_EMAIL,
  EXPIRED_RESET_PASSWORD,
  EXPIRED_OTP_EMAIL,
  EXPIRED_OTP_SMS,
  TOTP_PERIOD,
  TOTP_WINDOW,
  SECURITY_TIPS,
};
