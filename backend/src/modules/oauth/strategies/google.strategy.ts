import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleOAuthConfig } from '../auth-google/config/google-oauth.config.types';
import { OauthService } from '../oauth.service';
import { normalizeGoogleProfile } from '../auth-google/utils/normalize-profile.utils';
import { validateOAuthState } from '../utils/validate-oauth-state.utils';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    const config = configService.getOrThrow<GoogleOAuthConfig>('oauth.google');
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      const state = req.query.state as string; // Extract state from query parameters

      if (!profile) {
        return done(new BadRequestException('Google profile is undefined'));
      }

      // Validate state parameter BEFORE processing
      validateOAuthState(state);

      const normalized_data = normalizeGoogleProfile(profile);

      req.oauth_profile = normalized_data;

      const user = await this.oauthService.verifyOAuthAccount(
        normalized_data,
        state,
      );

      done(null, user);
    } catch (error) {
      this.logger.error(
        `Google OAuth validation error: ${error.message}`,
        error,
      );
      done(error, false);
    }
  }
}
