import { GithubOAuthState } from '../types/github-google.types';

export const extractStateGithub = (state: string): GithubOAuthState => {
  if (!state) {
    return {
      device_fingerprint: null,
      auth_type: 'none',
      user_id: null,
      action: null,
      link_token: null,
    };
  }

  const decoded = JSON.parse(
    Buffer.from(state, 'base64').toString('ascii'),
  ) as GithubOAuthState;
  const device_fingerprint = decoded.device_fingerprint;
  const auth_type = decoded.auth_type;
  const user_id = decoded.user_id;
  const action = decoded.action;
  const link_token = decoded.link_token;

  return { device_fingerprint, auth_type, user_id, action, link_token };
};
