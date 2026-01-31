import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { googleOAuthConfig } from './config/google-oauth.config';

/**
 * Google OAuth Module
 * Handles Google OAuth authentication and configuration
 */
@Module({
  imports: [ConfigModule.forFeature(googleOAuthConfig)],
})
export class AuthGoogleModule {}
