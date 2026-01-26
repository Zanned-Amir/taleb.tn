/**
 * Language codes supported
 */
export type LanguageCode = 'en' | 'fr';

/**
 * Base context for all emails
 */
export interface BaseEmailContext {
  lang: LanguageCode;
  username: string;
}

/**
 * Welcome email context
 */
export interface WelcomeEmailContext extends BaseEmailContext {
  activationLink?: string;
}

/**
 * Email verification context
 */
export interface VerificationEmailContext extends BaseEmailContext {
  verificationLink: string;
  expiryTime?: string; // e.g., "24 hours"
}

/**
 * Password reset email context
 */
export interface PasswordResetEmailContext extends BaseEmailContext {
  resetLink: string;
  expiryTime?: string; // e.g., "1 hour"
}

/**
 * Password changed confirmation context
 */
export interface PasswordChangedEmailContext extends BaseEmailContext {
  changedAt?: string; // ISO timestamp or formatted date
}

/**
 * Study partner match notification context
 */
export interface StudyPartnerMatchEmailContext extends BaseEmailContext {
  partnerName: string;
  interests: string; // comma-separated or formatted string
  matchLink?: string;
  matchPercentage?: number; // 0-100
}

/**
 * Union type for all email contexts
 */
export type EmailContext =
  | WelcomeEmailContext
  | VerificationEmailContext
  | PasswordResetEmailContext
  | PasswordChangedEmailContext
  | StudyPartnerMatchEmailContext;

/**
 * Email template names
 */
export const EMAIL_TEMPLATES = {
  welcome: 'welcome',
  passwordReset: 'password-reset',
  passwordChanged: 'password-changed',
  verification: 'verification',
  studyPartnerMatch: 'study-partner-match',
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
  [EMAIL_TEMPLATES.passwordChanged]: {} as PasswordChangedEmailContext,
  [EMAIL_TEMPLATES.verification]: {} as VerificationEmailContext,
  [EMAIL_TEMPLATES.studyPartnerMatch]: {} as StudyPartnerMatchEmailContext,
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
