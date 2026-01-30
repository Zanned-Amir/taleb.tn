export const SESSION_REVOC_R = {
  manual_logout: 'manual_logout',
  all_device_logout: 'all_device_logout',
  password_change: 'password_change',
  admin_revocation: 'admin_revocation',
  suspicious_activity: 'suspicious_activity',
  password_reset: 'password_reset',
  email_change: 'email_change',
} as const;

export type SessionRevokeReason =
  (typeof SESSION_REVOC_R)[keyof typeof SESSION_REVOC_R];
