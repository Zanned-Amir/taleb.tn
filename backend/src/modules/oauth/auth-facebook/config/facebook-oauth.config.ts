import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  FacebookOAuthConfig,
  FacebookOAuthConfigValidation,
} from './facebook-oauth.config.types';

/**
 * Facebook OAuth Configuration Loader
 */
export const facebookOAuthConfig = registerAs(
  'facebook',
  (): FacebookOAuthConfig => {
    // Create config object
    const configObj = {
      enabled: process.env.FACEBOOK_AUTH_ENABLED === 'true',
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackUrl:
        process.env.FACEBOOK_CALLBACK_URL ||
        'http://localhost:3000/api/oauth/facebook/callback',
    };

    // Validate the config object
    const config = plainToInstance(FacebookOAuthConfigValidation, configObj);
    const errors = validateSync(config);

    if (errors.length > 0) {
      throw new Error(
        `Facebook OAuth config validation error:\n${errors
          .map(
            (error) =>
              `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
          )
          .join('\n')}`,
      );
    }

    return config as FacebookOAuthConfig;
  },
);
