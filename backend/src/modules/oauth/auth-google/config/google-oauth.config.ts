import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  GoogleOAuthConfig,
  GoogleOAuthConfigValidation,
} from './google-oauth.config.types';

/**
 * Google OAuth Configuration Loader
 */
export const googleOAuthConfig = registerAs('google', (): GoogleOAuthConfig => {
  // Create config object
  const configObj = {
    enabled: process.env.GOOGLE_AUTH_ENABLED === 'true',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/oauth/google/callback',
  };

  // Validate the config object
  const config = plainToInstance(GoogleOAuthConfigValidation, configObj);
  const errors = validateSync(config);

  if (errors.length > 0) {
    throw new Error(
      `Google OAuth config validation error:\n${errors
        .map(
          (error) =>
            `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
        )
        .join('\n')}`,
    );
  }

  return config as GoogleOAuthConfig;
});
