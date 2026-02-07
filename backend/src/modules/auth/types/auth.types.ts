// activty-log action types

export const RESSOURCE = {
  chat: 'chat',
  users: 'users',
  role: 'role',
  session: 'session',
  oauth_account: 'oauth_account',
  me: 'me',
  m2fa: 'm2fa',
  auth_settings: 'auth_settings',
} as const;

export type Resource = (typeof RESSOURCE)[keyof typeof RESSOURCE];

export const ACTION = {
  create: 'create',
  read: 'read',
  update: 'update',
  delete: 'delete',
  suspend: 'suspend',
  unsuspend: 'unsuspend',
  assign_role: 'assign_role',
  remove_role: 'remove_role',
  restore: 'restore',
} as const;

export type Action = (typeof ACTION)[keyof typeof ACTION];

export const ACTIVITY_LOG_ACTION = {
  login: 'login',
  logout: 'logout',
  register: 'register',
  password_change: 'password_change',
  email_change: 'email_change',
  mfa_enabled: 'mfa_enabled',
  mfa_disabled: 'mfa_disabled',
  profile_update: 'profile_update',
  settings_update: 'settings_update',
  resource_create: 'resource_create',
  resource_update: 'resource_update',
  resource_delete: 'resource_delete',
  export: 'export',
  import: 'import',
  role_change: 'role_change',
  permission_change: 'permission_change',
  failed_login: 'failed_login',
  security_alert: 'security_alert',
} as const;

export type ActivityLogAction =
  (typeof ACTIVITY_LOG_ACTION)[keyof typeof ACTIVITY_LOG_ACTION];

export const ActivityLog_EVENTS = {
  CREATED: 'activity-log.created',
} as const;

export type ActivityLogEvent =
  (typeof ActivityLog_EVENTS)[keyof typeof ActivityLog_EVENTS];

export const ACTIVITY_LOG_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  WARNING: 'warning',
} as const;

export type ActivityLogStatus =
  (typeof ACTIVITY_LOG_STATUS)[keyof typeof ACTIVITY_LOG_STATUS];

export const AUTH_ACTION = {
  contact_support: 'contact_support', // account suspended or banned
  new_account_setup: 'new_account_setup', // first time login actions
  inactivate_account: 'inactivate_account', // account login after being  inactive for long period
  verify_email: 'verify_email', // email verification pending
  verify_phone: 'verify_phone', // phone verification required
  reset_password: 'reset_password', // password reset required
  banned: 'banned', // account is banned
  suspended: 'suspended', // account is suspended
  activate_account: 'activate_account', // account activation required after deactivation
  restore_account: 'restore_account', // restore soft deleted account
  reactivate_account: 'reactivate_account', // reactivate inactive/deactivated account
  enable_m2fa: 'enable_m2fa', // enable multi-factor authentication
  verify_m2fa: 'verify_m2fa', // verify multi-factor authentication code
  m2fa_setup: 'm2fa_setup', // setup multi-factor authentication
} as const;

export type AuthAction = (typeof AUTH_ACTION)[keyof typeof AUTH_ACTION];

// m2fa methods
export const M2FA_METHOD = {
  totp: 'totp',
  email_otp: 'email_otp',
  sms_otp: 'sms_otp',
  backup_code: 'backup_code',
} as const;

export type M2FAMethod = (typeof M2FA_METHOD)[keyof typeof M2FA_METHOD];

export const TOKEN_TYPE = {
  email_verification: 'email_verification',
  password_reset: 'password_reset',
  otp_password_reset: 'otp_password_reset',
  confirm_email: 'confirm_email',
  change_email: 'change_email',
  m2fa_setup: 'm2fa_setup',
} as const;
export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

export const Token_EXPIRATION = {
  email_verification_ms: 1000 * 60 * 60 * 24, // 24 hours
  password_reset_ms: 1000 * 60 * 60, // 1 hour
} as const;

export const ROLE = {
  admin: 'admin',
  user: 'user',
} as const;

export type RoleType = (typeof ROLE)[keyof typeof ROLE];

export const RL_ACTION = {
  login_attempt: 'login_attempt',
  password_reset_request: 'password_reset_request',
  m2fa_attempt: 'm2fa_attempt',
  email_change_request: 'email_change_request',
  contact_support_request: 'contact_support_request',
  confirm_email_request: 'confirm_email_request',
  change_email_request: 'change_email_request',
} as const;

export type RateLimitAction = (typeof RL_ACTION)[keyof typeof RL_ACTION];

export const OTP_TYPE = {
  email_verification: 'email_verification',
  reset_password: 'reset_password',
} as const;

export type OtpType = (typeof OTP_TYPE)[keyof typeof OTP_TYPE];
