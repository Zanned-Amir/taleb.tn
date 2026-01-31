import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { OAuthProfile } from '../../types/oauth-provider.interface';
import { OAUTH_PROVIDER } from '../../types/outh.type';

export const normalizeGoogleProfile = (
  profile: GoogleProfile,
): OAuthProfile => {
  return {
    provider: OAUTH_PROVIDER.google,
    provider_id: profile.id,
    email: profile.emails?.[0]?.value || profile._json?.email || '',
    email_verified:
      profile.emails?.[0]?.verified ?? profile._json?.email_verified ?? false,
    first_name: profile.name?.givenName || profile._json?.given_name || null,
    last_name: profile.name?.familyName || profile._json?.family_name || null,
    picture: profile.photos?.[0]?.value || profile._json?.picture || null,
    country_code: profile._json?.locale?.toUpperCase() || null,
    raw_data: {
      sub: profile._json.sub,
      name: profile._json.name,
      given_name: profile._json.given_name,
      family_name: profile._json.family_name,
      picture: profile._json.picture,
      email: profile._json.email,
      email_verified: profile._json.email_verified,
      locale: profile._json.locale,
    },
  };
};
