/**
 * Language codes supported
 */
export type LanguageCode = 'en' | 'fr' | 'ar' | 'tn';

/**
 * Base context for all emails
 */
export interface BaseEmailContext {
  lang: LanguageCode;
  username: string;
  currentYear?: number;
}

/**
 * Welcome email context
 */
export interface WelcomeEmailContext extends BaseEmailContext {
  activationLink?: string;
}

/**
 * Email verification context (link based)
 */
export interface VerificationEmailContext extends BaseEmailContext {
  verificationLink: string;
  expiryTime?: string; // e.g., "24 hours"
}

/**
 *  Email verification context (otp based)
 */
export interface VerificationOTPEmailContext extends BaseEmailContext {
  otpCode: string;
  expiryTime?: string; // e.g., "10 minutes"
}

/**
 * Password reset email context (link based)
 */
export interface PasswordResetEmailContext extends BaseEmailContext {
  resetLink: string;
  expiryTime?: string; // e.g., "1 hour"
}

/**
 *   Password reset email context (otp based)
 */

export interface PasswordResetOTPEmailContext extends BaseEmailContext {
  otpCode: string;
  expiryTime?: string; // e.g., "10 minutes"
}

/**
 * Password changed confirmation context
 */
export interface PasswordChangedEmailContext extends BaseEmailContext {
  changedAt?: string; // ISO timestamp or formatted date
}

/**
 * Change email confirmation context (link based)
 */
export interface ChangeEmailEmailContext extends BaseEmailContext {
  firstName: string;
  newEmail: string;
  confirmationLink: string;
}

/**
 * Email changed notification context
 */
export interface EmailChangedEmailContext extends BaseEmailContext {
  firstName: string;
  previousEmail: string;
  newEmail: string;
  changeDate: string; // formatted date
  accountSettingsLink: string;
}

/**
 * M2FA OTP email context
 */
export interface M2FAOTPEmailContext extends BaseEmailContext {
  firstName: string;
  otp: string;
  expirationTime: number; // in minutes
}

/**
 * Union type for all email contexts
 */
export type EmailContext =
  | WelcomeEmailContext
  | VerificationEmailContext
  | PasswordResetEmailContext
  | PasswordResetOTPEmailContext
  | PasswordChangedEmailContext
  | VerificationOTPEmailContext
  | ChangeEmailEmailContext
  | EmailChangedEmailContext
  | M2FAOTPEmailContext;

/**
 * Email template names
 */
export const EMAIL_TEMPLATES = {
  welcome: 'welcome',
  passwordReset: 'password-reset',
  passwordResetOTP: 'password-reset-otp',
  passwordChanged: 'password-changed',
  verification: 'verification',
  verificationOTP: 'verification-otp',
  changeEmail: 'change-email',
  emailChanged: 'email-changed',
  m2faOTP: 'm2fa-otp',
} as const;

export type EmailTemplateType =
  (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

/**
 * Email queue name for Bull queue
 */
export const EMAIL_QUEUE = 'email_queue';

/**
 * Template data schemas for type safety
 */
export const EMAIL_TEMPLATES_DATA = {
  [EMAIL_TEMPLATES.welcome]: {} as WelcomeEmailContext,
  [EMAIL_TEMPLATES.passwordReset]: {} as PasswordResetEmailContext,
  [EMAIL_TEMPLATES.passwordResetOTP]: {} as PasswordResetOTPEmailContext,
  [EMAIL_TEMPLATES.passwordChanged]: {} as PasswordChangedEmailContext,
  [EMAIL_TEMPLATES.verification]: {} as VerificationEmailContext,
  [EMAIL_TEMPLATES.verificationOTP]: {} as VerificationOTPEmailContext,
  [EMAIL_TEMPLATES.changeEmail]: {} as ChangeEmailEmailContext,
  [EMAIL_TEMPLATES.emailChanged]: {} as EmailChangedEmailContext,
  [EMAIL_TEMPLATES.m2faOTP]: {} as M2FAOTPEmailContext,
};

/**
 * Email metadata for sending
 */
export interface EmailMetadata {
  template: EmailTemplateType;
  to: string;
  subject: string;
  context: EmailContext;
}
