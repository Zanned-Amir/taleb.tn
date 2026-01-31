import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthAppleModule } from './auth-apple/auth-apple.module';
import { AuthFacebookModule } from './auth-facebook/auth-facebook.module';
import { AuthGithubModule } from './auth-github/auth-github.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { OauthService } from './oauth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccount } from './entities/oauth_account.entity';
import { User } from '../users/entities/user.entity';
import { OauthController } from './oauth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    AuthGoogleModule,
    AuthGithubModule,
    AuthFacebookModule,
    AuthAppleModule,
    AuthModule,
    UsersModule,
    RedisModule,
    TypeOrmModule.forFeature([OAuthAccount, User]),
  ],
  exports: [
    OauthService,
    AuthGoogleModule,
    AuthGithubModule,
    AuthFacebookModule,
    AuthAppleModule,
  ],
  providers: [
    OauthService,
    {
      provide: GoogleStrategy,
      useFactory: (
        configService: ConfigService,
        oauthService: OauthService,
      ) => {
        const googleConfig = configService.get('oauth.google');
        if (googleConfig?.enabled) {
          return new GoogleStrategy(configService, oauthService);
        }
        return null;
      },
      inject: [ConfigService, OauthService],
    },

    {
      provide: FacebookStrategy,
      useFactory: (
        configService: ConfigService,
        oauthService: OauthService,
      ) => {
        const facebookConfig = configService.get('oauth.facebook');
        if (facebookConfig?.enabled) {
          return new FacebookStrategy(configService, oauthService);
        }
        return null;
      },
      inject: [ConfigService, OauthService],
    },
    {
      provide: GithubStrategy,
      useFactory: (
        configService: ConfigService,
        oauthService: OauthService,
      ) => {
        const githubConfig = configService.get('oauth.github');
        if (githubConfig?.enabled) {
          return new GithubStrategy(configService, oauthService);
        }
        return null;
      },
      inject: [ConfigService, OauthService],
    },

    //TODO: ADD APPLE STRATEGY PROVIDER HERE
  ],
  controllers: [OauthController],
})
export class OauthModule {}
