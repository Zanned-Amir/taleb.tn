export const OAUTH_PROVIDER = {
  google: 'google',
  facebook: 'facebook',
  apple: 'apple',
  github: 'github',
} as const;

export type OAUTH_PROVIDER =
  (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];

export interface BaseOAuthState {
  device_fingerprint: string | null;
  auth_type: 'none' | 'header' | 'cookie';
  user_id: number | null;
  action: 'link' | 'login' | null;
  link_token: string | null;
}
