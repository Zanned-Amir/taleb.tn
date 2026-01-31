import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuthAccount } from './entities/oauth_account.entity';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { oauthAccountPaginationConfig } from './pagination/oauth.pagination';
import { UpdateOAuthDto } from './dto/update-oauth.dto';
import { OAuthProfile } from './types/oauth-provider.interface';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SessionDto } from '../auth/dto/session.dto';
import { GoogleOAuthState } from './auth-google/types/auth-google.types';
import { AuthService } from '../auth/auth.service';
import { type Response } from 'express';
import { extractStateGoogle } from './auth-google/utils/extract-state.utils';

import Redis from 'ioredis';
import { OAUTH_PROVIDER } from './types/outh.type';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../redis/constant/redis.constant';
import { SALT_ROUNDS } from '../auth/constant/auth.constant';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  constructor(
    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepository: Repository<OAuthAccount>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async getOAuthAccount(query: PaginateQuery) {
    return await paginate(
      query,
      this.oauthAccountRepository,
      oauthAccountPaginationConfig,
    );
  }

  async getOAuthAccountById(id: number) {
    return await this.oauthAccountRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateOAuthAccount(id: number, dto: UpdateOAuthDto) {
    const result = await this.oauthAccountRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`OAuthAccount with id ${id} not found`);
    }
  }

  async deleteOAuthAccount(id: number) {
    const result = await this.oauthAccountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`OAuthAccount with id ${id} not found`);
    }
  }

  async verifyOAuthAccount(
    profile: OAuthProfile,
    state: string,
  ): Promise<User> {
    const { device_fingerprint, auth_type, user_id, action, link_token } =
      extractStateGoogle(state);

    this.logger.log(
      `Verifying OAuth account - Action: ${action}, Provider: ${profile.provider}`,
    );

    // Email verification check
    if (profile.email_verified === false) {
      throw new NotFoundException('Email not verified by OAuth provider');
    }

    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: {
        provider: profile.provider,
        provider_account_id: profile.provider_id,
      },
      relations: ['user'],
    });

    if (action === 'link' && user_id && link_token) {
      this.logger.log(`Linking OAuth account to user ${user_id} as requested`);

      if (oauthAccount) {
        throw new BadRequestException(
          'OAuth account already linked to another user',
        );
      }

      const hashed_link_token = await this.redisClient.get(
        `oauth:link:${user_id}:${profile.provider}`,
      );

      if (!hashed_link_token) {
        throw new BadRequestException('Invalid or expired link token');
      }

      const isTokenValid = await bcrypt.compare(link_token, hashed_link_token);
      if (!isTokenValid) {
        throw new BadRequestException('Invalid link token');
      }
      await this.userService.linkOAuthAccount(user_id, profile);

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${user_id} not found`);
      }

      await this.redisClient.del(`oauth:link:${user_id}:${profile.provider}`);

      return user;
    }

    if (!oauthAccount && action === 'login') {
      const user = await this.userRepository.findOne({
        where: { email: profile.email },
      });

      // if user exists, link oauth account to existing user
      if (user) {
        await this.userService.linkOAuthAccount(user.id, profile);

        return user;

        // If user does not exist, create a new user and oauth account
      } else {
        const user = await this.userService.createOAuthUser(profile);

        return user;
      }
    }
    if (!oauthAccount && action !== 'login') {
      throw new NotFoundException(
        'No linked OAuth account found. Please register or link your OAuth account first.',
      );
    }

    return oauthAccount!.user;
  }

  async linkOAuthAccount(user_id: number, provider: OAUTH_PROVIDER) {
    this.logger.log(
      `Attempting to link ${provider} account for user ${user_id}`,
    );

    const account = await this.oauthAccountRepository.findOne({
      where: {
        user_id,
        provider,
      },
    });
    if (account) {
      throw new BadRequestException(
        `${provider} account already linked to your account`,
      );
    }

    const checkOAuth = await this.oauthAccountRepository.findOne({
      where: {
        user_id,
        provider,
      },
    });

    if (checkOAuth) {
      throw new BadRequestException(
        `User already has a linked ${provider} account`,
      );
    }

    const uuid = crypto.randomUUID();
    const hash = await bcrypt.hash(uuid, SALT_ROUNDS);
    await this.redisClient.set(
      `oauth:link:${user_id}:${provider}`,
      hash,
      'EX',
      300, // 5 minutes expiration
    );
    const host = this.configService.getOrThrow<string>('FRONTEND_URL');

    const url = `${host}/api/oauth/${provider}/login?link_token=${uuid}&user_id=${user_id}&action=link`;
    const expires_at = new Date(Date.now() + 300 * 1000);

    this.logger.log(
      `Generated link token for ${provider} account linking, expires at ${expires_at}`,
    );

    return {
      success: true,
      url,
      expires_at,
      provider,
      message: `Click the link to authorize ${provider} account linking. The link expires in 5 minutes.`,
    };
  }

  async unlinkOAuthAccount(user_id: number, provider: OAUTH_PROVIDER) {
    this.logger.log(
      `Attempting to unlink ${provider} account for user ${user_id}`,
    );

    const account = await this.oauthAccountRepository.findOne({
      where: {
        user_id,
        provider,
      },
      relations: ['user'],
    });

    if (!account) {
      this.logger.warn(
        `No linked ${provider} account found for user ${user_id}`,
      );
      throw new NotFoundException(
        `No linked ${provider} account found. Please link a ${provider} account first.`,
      );
    }

    await this.oauthAccountRepository.remove(account);
    this.logger.log(
      `Successfully unlinked ${provider} account for user ${user_id}`,
    );

    return {
      success: true,
      message: `${provider} account successfully unlinked`,
      provider,
    };
  }

  async oAuthCallBack(
    user: User,
    state: string,
    dto: SessionDto,
    res: Response,
    provider: OAUTH_PROVIDER,
    profile: OAuthProfile,
  ) {
    const { device_fingerprint, auth_type, user_id, action, link_token } =
      extractStateGoogle(state);

    if (action === 'link' && user_id && link_token) {
      this.logger.log(
        `Linking ${profile?.provider} account for user ${user_id}`,
      );

      const oauthAccount = await this.oauthAccountRepository.findOne({
        where: {
          user_id,
          provider: provider,
        },
      });

      return {
        success: true,
        oauthAccount,
        message: `${profile?.provider} account linked successfully`,
      };
    }
    if (action === 'login') {
      if (user && user_id) {
        await this.oauthAccountRepository.update(
          {
            provider: provider,
            user_id,
          },
          {
            last_used_at: new Date(),
          },
        );
      }

      if (auth_type === 'cookie') {
        this.logger.log(`Logging in user ${user.id} with cookies`);
        return await this.authService.loginWithCookies(user, dto, res);
      } else if (auth_type === 'header') {
        this.logger.log(`Logging in user ${user.id} with headers`);
        return await this.authService.login(user, dto);
      }
    }

    throw new BadRequestException('Invalid query parameters');
  }
}
