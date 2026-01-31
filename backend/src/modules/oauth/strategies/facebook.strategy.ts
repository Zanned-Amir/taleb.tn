import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyFunction } from 'passport-facebook';

import { FacebookOAuthConfig } from '../auth-facebook/config/facebook-oauth.config.types';
import { normalizeFacebookProfile } from '../auth-facebook/utils/normalize-profile';
import { validateOAuthState } from '../utils/validate-oauth-state.utils';
import { OauthService } from '../oauth.service';
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(FacebookStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    const config =
      configService.getOrThrow<FacebookOAuthConfig>('oauth.facebook');
    super({
      clientID: config.appId,
      clientSecret: config.appSecret,
      callbackURL: config.callbackUrl,
      scope: ['email', 'public_profile'],
      passReqToCallback: true,
      enableProof: true,
    });
  }

  async validate(
    req: any,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    try {
      const state = req.query.state as string; // Extract state from query parameters

      if (!profile) {
        return done(new BadRequestException('Facebook profile is undefined'));
      }

      // Validate state parameter BEFORE processing
      validateOAuthState(state);

      const normalized_data = normalizeFacebookProfile(profile);

      req.oauth_profile = normalized_data;
      if (!normalized_data.email) {
        return done(
          new BadRequestException('Facebook profile does not contain email'),
        );
      }

      const user = await this.oauthService.verifyOAuthAccount(
        normalized_data,
        state,
      );

      done(null, user);
    } catch (error) {
      this.logger.error(
        `Facebook OAuth validation error: ${error.message}`,
        error,
      );
      done(error, false);
    }
  }
}
