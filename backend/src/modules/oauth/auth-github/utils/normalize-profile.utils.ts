import { Profile as GithubProfile } from 'passport-github2';
import { OAuthProfile } from '../../types/oauth-provider.interface';
import { OAUTH_PROVIDER } from '../../types/outh.type';

export const normalizeGithubProfile = (
  profile: GithubProfile,
): OAuthProfile => {
  // Cast to any to access extended properties
  const rawProfile = profile as any;

  // Extract name parts from display name or use username
  const nameParts = (profile.displayName || profile.username || '').split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  return {
    provider: OAUTH_PROVIDER.github,
    provider_id:
      profile.id?.toString() || rawProfile._json?.id?.toString() || '',
    email:
      profile.emails?.[0]?.value ||
      rawProfile._json?.email ||
      profile.username ||
      '',
    email_verified: true, // GitHub doesn't provide email_verified in standard profile
    first_name: firstName,
    last_name: lastName || null,
    picture: profile.photos?.[0]?.value || rawProfile._json?.avatar_url || null,
    country_code: null, // GitHub doesn't provide locale/country
    raw_data: {
      id: rawProfile._json?.id,
      login: rawProfile._json?.login,
      node_id: rawProfile._json?.node_id,
      avatar_url: rawProfile._json?.avatar_url,
      gravatar_id: rawProfile._json?.gravatar_id,
      url: rawProfile._json?.url,
      html_url: rawProfile._json?.html_url,
      name: rawProfile._json?.name,
      company: rawProfile._json?.company,
      blog: rawProfile._json?.blog,
      location: rawProfile._json?.location,
      email: rawProfile._json?.email,
      bio: rawProfile._json?.bio,
      twitter_username: rawProfile._json?.twitter_username,
      public_repos: rawProfile._json?.public_repos,
      public_gists: rawProfile._json?.public_gists,
      followers: rawProfile._json?.followers,
      following: rawProfile._json?.following,
      created_at: rawProfile._json?.created_at,
      updated_at: rawProfile._json?.updated_at,
    },
  };
};
