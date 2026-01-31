import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  GitHubOAuthConfig,
  GitHubOAuthConfigValidation,
} from './github-oauth.config.types';

/**
 * GitHub OAuth Configuration Loader
 */
export const gitHubOAuthConfig = registerAs('github', (): GitHubOAuthConfig => {
  // Create config object
  const configObj = {
    enabled: process.env.GITHUB_AUTH_ENABLED === 'true',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ||
      'http://localhost:3000/api/oauth/github/callback',
  };

  // Validate the config object
  const config = plainToInstance(GitHubOAuthConfigValidation, configObj);
  const errors = validateSync(config);

  if (errors.length > 0) {
    throw new Error(
      `GitHub OAuth config validation error:\n${errors
        .map(
          (error) =>
            `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
        )
        .join('\n')}`,
    );
  }

  return config as GitHubOAuthConfig;
});
