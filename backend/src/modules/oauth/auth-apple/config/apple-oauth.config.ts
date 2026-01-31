import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  AppleOAuthConfig,
  AppleOAuthConfigValidation,
} from './apple-oauth.config.types';

/**
 * Apple OAuth Configuration Loader
 */
export const appleOAuthConfig = registerAs('apple', (): AppleOAuthConfig => {
  // Create config object
  const configObj = {
    enabled: process.env.APPLE_AUTH_ENABLED === 'true',
    teamId: process.env.APPLE_TEAM_ID || '',
    clientId: process.env.APPLE_CLIENT_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    callbackUrl:
      process.env.APPLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/apple/callback',
  };

  // Validate the config object
  const config = plainToInstance(AppleOAuthConfigValidation, configObj);
  const errors = validateSync(config);

  if (errors.length > 0) {
    throw new Error(
      `Apple OAuth config validation error:\n${errors
        .map(
          (error) =>
            `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
        )
        .join('\n')}`,
    );
  }

  return config as AppleOAuthConfig;
});
