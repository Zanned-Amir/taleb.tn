// oauth/utils/profile-normalizers/facebook.normalizer.ts
import { Profile as FacebookProfile } from 'passport-facebook';
import { OAuthProfile } from '../../types/oauth-provider.interface';
import { OAUTH_PROVIDER } from '../../types/outh.type';

export const normalizeFacebookProfile = (
  profile: FacebookProfile,
): OAuthProfile => {
  return {
    provider: OAUTH_PROVIDER.facebook,
    provider_id: profile.id,
    email: profile.emails?.[0]?.value || '',
    email_verified: true, // Facebook doesn't provide email_verified in standard profile
    first_name: profile.name?.givenName || null,
    last_name: profile.name?.familyName || null,
    picture: profile.photos?.[0]?.value || null,
    country_code: null, // Facebook doesn't provide locale in standard profile
    raw_data: {
      id: profile.id,
      displayName: profile.displayName,
      name: profile.name,
      emails: profile.emails,
      photos: profile.photos,
      provider: profile.provider,
    },
  };
};
