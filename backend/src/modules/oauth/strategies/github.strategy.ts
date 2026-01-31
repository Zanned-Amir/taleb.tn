import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OauthService } from '../oauth.service';
import { Profile, Strategy } from 'passport-github2';
import { normalizeGithubProfile } from '../auth-github/utils/normalize-profile.utils';
import { validateOAuthState } from '../utils/validate-oauth-state.utils';
import { GitHubOAuthConfig } from '../auth-github/config/github-oauth.config.types';
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GithubStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    const config = configService.getOrThrow<GitHubOAuthConfig>('oauth.github');
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: ['read:user', 'user:email'],
      passReqToCallback: true,
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
        return done(new BadRequestException('GitHub profile is undefined'));
      }

      // Validate state parameter BEFORE processing
      validateOAuthState(state);

      const normalized_data = normalizeGithubProfile(profile);

      req.oauth_profile = normalized_data;
      if (!normalized_data.email) {
        return done(
          new BadRequestException('GitHub profile does not contain email'),
        );
      }

      const user = await this.oauthService.verifyOAuthAccount(
        normalized_data,
        state,
      );

      done(null, user);
    } catch (error) {
      this.logger.error(
        `GitHub OAuth validation error: ${error.message}`,
        error,
      );
      done(error, false);
    }
  }
}
