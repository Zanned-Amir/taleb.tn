import { OAUTH_PROVIDER } from '../types/outh.type';

export interface OAuthProfile {
  provider: OAUTH_PROVIDER;
  provider_id: string;
  email: string;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  country_code?: string | null;
  raw_data: Record<string, any>;
}
