import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AccessTokenPayload } from './types/auth.interfaces';
import { Redis } from 'ioredis';
import ms, { StringValue } from 'ms';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { M2FA } from './entites/m2fa.entity';
import { RefreshToken } from './entites/refresh-token.entity';
import { Role } from '../users/entities/role.entity';
import { Session } from '../sessions/entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { SessionDto } from './dto/session.dto';
import { ACCOUNT_STATUS } from '../users/types/users.types';
import {
  AUTH_ACTION,
  M2FA_METHOD,
  M2FAMethod,
  OTP_TYPE,
  RL_ACTION,
  TOKEN_TYPE,
} from './types/auth.types';
import { UsersService } from '../users/users.service';
import { Response } from 'express';
import { SESSION_REVOC_R } from '../sessions/types/session.types';
import {
  EXPIRED_CHANGE_EMAIL,
  EXPIRED_CONFIRM_EMAIL,
  EXPIRED_OTP_EMAIL,
  EXPIRED_RESET_PASSWORD,
  SALT_ROUNDS,
  TOTP_PERIOD,
  TOTP_WINDOW,
} from './constant/auth.constant';
import { REDIS_CLIENT } from '../redis/constant/redis.constant';
import { Token } from './entites/token.entity';

import * as OTPAuth from 'otpauth';
import { OtpToken } from './entites/otp-token.entity';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { OptionUserDto } from '../users/dto/option-user.dto';
import { UpdateUserMeDto } from '../users/dto/update-user.dto';
import { UpdateUserSettingsMeDto } from '../users/dto/update-settings.dto';
import { EMAIL_QUEUE, EMAIL_TEMPLATES } from '../email/types/email.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private config: {
    jwt_secret: string;
    jwt_expiration: string;
    jwt_refresh_secret: string;
    jwt_refresh_expiration: string;
  };
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(M2FA)
    private readonly m2faRepository: Repository<M2FA>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(OtpToken)
    private readonly otpTokenRepository: Repository<OtpToken>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    this.config = {
      jwt_secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      jwt_expiration: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
      jwt_refresh_secret:
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      jwt_refresh_expiration: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    };
  }

  private nextAction(user: User) {
    const actions: string[] = [];

    // 1. CHECK FOR BANS OR SUSPENSIONS - Immediate account restrictions
    if (user.status === ACCOUNT_STATUS.suspended) {
      actions.push(AUTH_ACTION.banned);
      return actions; // Stop here - no other actions matter
    }

    // 2. SECURITY REQUIREMENTS - Must complete before account access
    if (user.password_reset_required) {
      actions.push(AUTH_ACTION.reset_password);
    }

    // 3. VERIFICATION REQUIREMENTS - Required for full access
    if (!user.is_verified) {
      actions.push(AUTH_ACTION.verify_email);
    }

    // 4. REACTIVATION - Returning users
    if (user.status === ACCOUNT_STATUS.inactive) {
      actions.push(AUTH_ACTION.inactivate_account);
    }

    // 5. ACCOUNT STATUS - Deactivated accounts
    if (user.status === ACCOUNT_STATUS.deactivated) {
      actions.push(AUTH_ACTION.reactivate_account);
      return actions; // Stop here - no other actions matter
    }

    // 6. MULTI-FACTOR AUTHENTICATION SETUP
    if (user.is_m2fa_enabled) {
      actions.push(AUTH_ACTION.m2fa_setup);
    }

    return actions;
  }

  private async checkRateLimit(user_id: number, action: string) {
    return;
    const hourKey = `rate-limit:${action}:${user_id}:hour`;
    const dayKey = `rate-limit:${action}:${user_id}:day`;

    // Increment counters atomically
    const [hourCount, dayCount] = await Promise.all([
      this.redisClient.incr(hourKey),
      this.redisClient.incr(dayKey),
    ]);

    // Set expiration on first request
    if (hourCount === 1) {
      await this.redisClient.expire(hourKey, 3600); // 1 hour
    }
    if (dayCount === 1) {
      await this.redisClient.expire(dayKey, 86400); // 24 hours
    }

    // Check limits
    if (hourCount > 5) {
      throw new HttpException(
        'Too many password reset requests. Try again in 1 hour.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (dayCount > 10) {
      throw new HttpException(
        'Daily limit exceeded. Try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { hourCount, dayCount };
  }

  private getCookieOptions() {
    const isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    const options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
    } = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    return options;
  }
  private generateTokens(payload: AccessTokenPayload) {
    const jwtOptions: JwtSignOptions = {
      secret: this.config.jwt_secret,
      expiresIn: this.config.jwt_expiration as StringValue,
    };
    const access_token = this.jwtService.sign(payload, jwtOptions);

    const ac_expires_in_ms = ms(this.config.jwt_expiration as StringValue) || 0;

    const refreshJwtOptions: JwtSignOptions = {
      secret: this.config.jwt_refresh_secret,
      expiresIn: this.config.jwt_refresh_expiration as StringValue,
    };

    const refresh_token = this.jwtService.sign(payload, refreshJwtOptions);

    const rf_expires_in_ms =
      ms(this.config.jwt_refresh_expiration as StringValue) || 0;

    const access_token_expires_at = new Date(Date.now() + ac_expires_in_ms);
    const refresh_token_expires_at = new Date(Date.now() + rf_expires_in_ms);
    const session_expires_at = new Date(
      Date.now() + rf_expires_in_ms + ms('1h'),
    );

    return {
      access_token,
      refresh_token,
      access_token_expires_at,
      refresh_token_expires_at,
      session_expires_at,
    };
  }

  private generateAccessToken(payload: AccessTokenPayload) {
    const ac_expires_in_ms = ms(this.config.jwt_expiration as StringValue);

    const access_token_expires_at = new Date(Date.now() + ac_expires_in_ms);

    const jwtOptions: JwtSignOptions = {
      secret: this.config.jwt_secret,
      expiresIn: this.config.jwt_expiration as StringValue,
    };

    const access_token = this.jwtService.sign(payload, jwtOptions);

    return {
      access_token,
      access_token_expires_at,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      throw new BadRequestException('Invalid credentials');
    }

    return user;
  }

  async getUserJwt(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['roles'],
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async verifyRefreshToken(
    refresh_token: string,
    user_id: number,
    session_id: number,
  ) {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        token: refresh_token,
        user_id,
        session_id,
      },

      relations: ['user'],
    });

    if (!storedToken) {
      throw new BadRequestException('Invalid refresh token');
    }
    const session = await this.sessionRepository.findOne({
      where: { id: session_id, user_id },
    });

    if (!session || !session.is_active) {
      throw new BadRequestException('Invalid session');
    }
    await this.refreshTokenRepository.delete({ id: storedToken.id });

    return storedToken.user;
  }

  async register(dto: RegisterDto, session_data: SessionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.register(dto, queryRunner);

      const actions = this.nextAction(user);

      const session = this.sessionRepository.create({
        user_id: user.id,
        is_active: true,
        device_fingerprint: session_data.device_fingerprint,
        ip_address: session_data.ip_address,
        user_agent: session_data.user_agent,
      });

      const savedSession = await queryRunner.manager.save(session);

      const payload: AccessTokenPayload = {
        user_id: user.id,
        session_id: savedSession.id,
        m2fa_authenticated: false,
        m2fa_required: false,
      };
      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        session_expires_at,
      } = this.generateTokens(payload);

      const createdRefreshToken = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        expires_at: refresh_token_expires_at,
        session_id: savedSession.id,
      });

      await queryRunner.manager.save(createdRefreshToken);
      await queryRunner.commitTransaction();

      return {
        access_token,
        access_token_expires_at,
        refresh_token,
        refresh_token_expires_at,
        session_id: savedSession.id,
        session_expires_at,
        actions,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async registerWithCookies(
    dto: RegisterDto,
    session_data: SessionDto,
    response: Response,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.register(dto, queryRunner);
      const session = this.sessionRepository.create({
        user_id: user.id,
        is_active: true,
        device_fingerprint: session_data.device_fingerprint,
        ip_address: session_data.ip_address,
        user_agent: session_data.user_agent,
      });
      const savedSession = await queryRunner.manager.save(session);
      const payload: AccessTokenPayload = {
        user_id: user.id,
        session_id: savedSession.id,
        m2fa_authenticated: false,
        m2fa_required: false,
      };
      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        session_expires_at,
      } = this.generateTokens(payload);

      const createdRefreshToken = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        session_id: savedSession.id,
        expires_at: refresh_token_expires_at,
      });
      await queryRunner.manager.save(createdRefreshToken);

      // TODO: email verification

      // Set cookies
      const cookieOptions = this.getCookieOptions();
      response.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
      response.cookie('refresh', refresh_token, {
        ...cookieOptions,
        expires: refresh_token_expires_at,
      });
      response.cookie('session', savedSession.id, {
        ...cookieOptions,
        expires: session_expires_at,
      });
      await queryRunner.commitTransaction();
      const actions = this.nextAction(user);

      return { actions };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async loginWithCookies(
    user: User,
    session_data: SessionDto,
    response: Response,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = this.sessionRepository.create({
        user_id: user.id,
        is_active: true,
        device_fingerprint: session_data.device_fingerprint,
        ip_address: session_data.ip_address,
        user_agent: session_data.user_agent,
      });
      const savedSession = await queryRunner.manager.save(session);

      const payload: AccessTokenPayload = {
        user_id: user.id,
        session_id: savedSession.id,
        m2fa_authenticated: user.is_m2fa_enabled ? false : true,
        m2fa_required: user.is_m2fa_enabled ? true : false,
      };
      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
      } = this.generateTokens(payload);

      const createdRefreshToken = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        expires_at: refresh_token_expires_at,
        session_id: savedSession.id,
      });

      await queryRunner.manager.save(createdRefreshToken);

      // Set cookies
      const cookieOptions = this.getCookieOptions();

      response.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
      response.cookie('refresh', refresh_token, {
        ...cookieOptions,
        expires: refresh_token_expires_at,
      });

      await queryRunner.commitTransaction();
      const actions = this.nextAction(user);

      return { actions };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logoutWithCookies(user: User, session_id: number, response: Response) {
    const updatedSession = await this.sessionRepository.update(
      { id: session_id, user_id: user.id, is_active: true },
      {
        is_active: false,
        revoked_at: new Date(),
        revoke_reason: SESSION_REVOC_R.manual_logout,
      },
    );
    if (updatedSession.affected && updatedSession.affected > 0) {
      this.logger.log(`Logged out session ${session_id} for user ${user.id}`);
      await this.refreshTokenRepository.delete({ session_id });
    } else {
      this.logger.warn(
        `No active session ${session_id} found for user ${user.id}`,
      );
      throw new NotFoundException('No active session found to logout');
    }

    const cookieOptions = this.getCookieOptions();

    response.clearCookie('authentication', cookieOptions);
    response.clearCookie('refresh', cookieOptions);
  }

  async logoutAllSessionsWithCookies(user: User, response: Response) {
    const updatedSessions = await this.sessionRepository.update(
      { user_id: user.id, is_active: true },
      {
        is_active: false,
        revoked_at: new Date(),
        revoke_reason: SESSION_REVOC_R.all_device_logout,
      },
    );
    if (updatedSessions.affected && updatedSessions.affected > 0) {
      this.logger.log(
        `Logged out all sessions for user ${user.id}, total: ${updatedSessions.affected}`,
      );

      await this.refreshTokenRepository.delete({ user_id: user.id });
    } else {
      this.logger.warn(`No active sessions found for user ${user.id}`);
      throw new NotFoundException('No active sessions found to logout');
    }

    const cookieOptions = this.getCookieOptions();

    response.clearCookie('authentication', cookieOptions);
    response.clearCookie('refresh', cookieOptions);
  }

  async login(user: User, session_data: SessionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = this.sessionRepository.create({
        user_id: user.id,
        is_active: true,
        device_fingerprint: session_data.device_fingerprint,
        ip_address: session_data.ip_address,
        user_agent: session_data.user_agent,
      });
      const savedSession = await queryRunner.manager.save(session);

      const payload: AccessTokenPayload = {
        user_id: user.id,
        session_id: savedSession.id,
        m2fa_authenticated: user.is_m2fa_enabled ? false : true,
        m2fa_required: user.is_m2fa_enabled ? true : false,
      };
      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        session_expires_at,
      } = this.generateTokens(payload);

      const createdRefreshToken = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        expires_at: refresh_token_expires_at,
        session_id: savedSession.id,
      });

      await queryRunner.manager.save(createdRefreshToken);

      const actions = this.nextAction(user);
      await queryRunner.commitTransaction();
      return {
        access_token,
        access_token_expires_at,
        refresh_token,
        refresh_token_expires_at,
        session_id: savedSession.id,
        session_expires_at,
        actions,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logout(user: User, session_id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedSession = await queryRunner.manager.update(
        Session,
        { id: session_id, user_id: user.id, is_active: true },
        {
          is_active: false,
          revoked_at: new Date(),
          revoke_reason: SESSION_REVOC_R.manual_logout,
        },
      );

      if (updatedSession.affected && updatedSession.affected > 0) {
        this.logger.log(`Logged out session ${session_id} for user ${user.id}`);
        await queryRunner.manager.delete(RefreshToken, { session_id });
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `No active session ${session_id} found for user ${user.id}`,
        );
        throw new NotFoundException('No active session found to logout');
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logoutAllSessions(user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedSessions = await queryRunner.manager.update(
        Session,
        { user_id: user.id, is_active: true },
        {
          is_active: false,
          revoked_at: new Date(),
          revoke_reason: SESSION_REVOC_R.all_device_logout,
        },
      );

      if (updatedSessions.affected && updatedSessions.affected > 0) {
        this.logger.log(
          `Logged out all sessions for user ${user.id}, total: ${updatedSessions.affected}`,
        );
        await queryRunner.manager.delete(RefreshToken, { user_id: user.id });
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.warn(`No active sessions found for user ${user.id}`);
        throw new NotFoundException('No active sessions found to logout');
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshTokenWithCookies(
    user: User,
    session_id: number,
    response: Response,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify session is still active
      const session = await queryRunner.manager.findOne(Session, {
        where: { id: session_id, user_id: user.id, is_active: true },
      });

      if (!session) {
        throw new NotFoundException('Session not found or is inactive');
      }

      const payload: AccessTokenPayload = {
        user_id: user.id,
        session_id,
        m2fa_authenticated: true,
        m2fa_required: user.is_m2fa_enabled ? true : false,
      };

      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        session_expires_at,
      } = this.generateTokens(payload);

      const cookieOptions = this.getCookieOptions();

      const refreshTokenEntity = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        session_id,
        expires_at: refresh_token_expires_at,
      });

      await queryRunner.manager.save(RefreshToken, refreshTokenEntity);

      response.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
      response.cookie('refresh', refresh_token, {
        ...cookieOptions,
        expires: refresh_token_expires_at,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(user: User, session_id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify session is still active
      const session = await queryRunner.manager.findOne(Session, {
        where: { id: session_id, user_id: user.id, is_active: true },
      });

      if (!session) {
        throw new NotFoundException('Session not found or is inactive');
      }

      await queryRunner.manager.delete(RefreshToken, {
        user_id: user.id,
        session_id,
      });

      const payload = {
        user_id: user.id,
        session_id,
        m2fa_authenticated: true,
        m2fa_required: user.is_m2fa_enabled ? true : false,
      };

      const {
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        session_expires_at,
      } = this.generateTokens(payload);

      const refreshTokenEntity = this.refreshTokenRepository.create({
        token: refresh_token,
        user_id: user.id,
        session_id,
        expires_at: refresh_token_expires_at,
      });

      await queryRunner.manager.save(RefreshToken, refreshTokenEntity);
      await queryRunner.commitTransaction();

      return {
        access_token,
        access_token_expires_at,
        refresh_token,
        refresh_token_expires_at,
        session_id,
        session_expires_at,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async changePassword(
    user_id: number,
    old_password: string,
    new_password: string,
    logout_all: boolean = false,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :user_id', { user_id })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSamePassword = await bcrypt.compare(new_password, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the old password',
      );
    }

    const authenticated = await bcrypt.compare(old_password, user.password);
    if (!authenticated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user.password = await bcrypt.hash(new_password, SALT_ROUNDS);
      await queryRunner.manager.save(User, user);

      if (logout_all) {
        await queryRunner.manager.update(
          Session,
          { user_id: user.id, is_active: true },
          {
            is_active: false,
            revoked_at: new Date(),
            revoke_reason: SESSION_REVOC_R.password_change,
          },
        );
        await queryRunner.manager.delete(RefreshToken, { user_id: user.id });
      }

      await queryRunner.commitTransaction();

      // Send password changed notification email with security tips
      await this.emailQueue.add(
        'password-changed',
        {
          template: EMAIL_TEMPLATES.passwordChanged,
          to: user.email,
          subject: 'Your Password Has Been Changed',
          context: {
            lang: 'en' as const,
            username: user.email,
            changedAt: new Date().toISOString(),
            currentYear: new Date().getFullYear(),
          },
        },
        { removeOnComplete: true },
      );

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async forgetPasswordByOtp(email: string, requestIp: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.checkRateLimit(user.id, RL_ACTION.password_reset_request);

    const token_id = crypto.randomUUID();

    const token = `${user.id}:${token_id}:${Date.now()}`;

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const secret = new OTPAuth.Secret({ size: 20 });

    const appName = this.configService.getOrThrow<string>('APP_NAME');

    const totp = new OTPAuth.TOTP({
      issuer: appName,
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: TOTP_PERIOD,
      secret: secret,
    });

    // Generate OTP
    const otp = totp.generate();

    const otpTokenEntity = this.otpTokenRepository.create({
      user_id: user.id,
      token: hash,
      otp_secret: secret.base32,
      expires_at: new Date(Date.now() + EXPIRED_OTP_EMAIL),
      type: OTP_TYPE.reset_password,
    });

    await this.otpTokenRepository.delete({
      user_id: user.id,
      type: OTP_TYPE.reset_password,
    });

    await this.otpTokenRepository.save(otpTokenEntity);

    this.logger.log(
      `Password reset OTP generated for token ${token} , OTP: ${otp}`,
    );

    // Send OTP via email (config auto-injected)
    await this.emailQueue.add(
      'password-reset-otp',
      {
        template: EMAIL_TEMPLATES.passwordResetOTP,
        to: user.email,
        subject: 'Your Password Reset Code',
        context: {
          lang: 'en' as const,
          username: user.email,
          otpCode: otp,
          expiryTime: '5 minutes',
          currentYear: new Date().getFullYear(),
        },
      },
      { removeOnComplete: true },
    );

    return {
      message: 'OTP sent to your email',
      token: token,
      expires_in: new Date(Date.now() + EXPIRED_OTP_EMAIL),
    };
  }

  async resetPasswordByOtp(
    token: string,
    otp_code: string,
    new_password: string,
  ) {
    const hash_token = crypto.createHash('sha256').update(token).digest('hex');

    const otpTokenEntity = await this.otpTokenRepository.findOne({
      where: {
        token: hash_token,
        type: OTP_TYPE.reset_password,
      },
    });

    if (!otpTokenEntity) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if token has expired
    if (new Date() > otpTokenEntity.expires_at) {
      this.logger.warn(`Password reset OTP token expired`);
      await this.otpTokenRepository.delete({ id: otpTokenEntity.id });
      throw new BadRequestException(
        'OTP has expired. Please request a new password reset.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: otpTokenEntity.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const appName = this.configService.getOrThrow<string>('APP_NAME');
    const totp = new OTPAuth.TOTP({
      issuer: appName,
      label: user.email,
      secret: OTPAuth.Secret.fromBase32(otpTokenEntity.otp_secret),
      digits: 6,
      algorithm: 'SHA1',
      period: TOTP_PERIOD,
    });

    const isValid = totp.validate({
      token: otp_code,
      window: TOTP_WINDOW,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = await bcrypt.hash(new_password, SALT_ROUNDS);

      const isSamePassword = await bcrypt.compare(new_password, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      if (user.password_reset_required) {
        user.password_reset_required = false;
      }
      await queryRunner.manager.save(User, user);

      // Revoke all active sessions
      await queryRunner.manager.update(
        Session,
        { user_id: user.id, is_active: true },
        {
          is_active: false,
          revoked_at: new Date(),
          revoke_reason: SESSION_REVOC_R.password_reset,
        },
      );

      // Delete all refresh tokens for this user
      await queryRunner.manager.delete(RefreshToken, { user_id: user.id });

      // Clean up used OTP token
      await queryRunner.manager.delete(OtpToken, {
        id: otpTokenEntity.id,
        type: OTP_TYPE.reset_password,
      });

      await queryRunner.commitTransaction();

      // email notification about password reset
      await this.emailQueue.add(
        'password-changed',
        {
          template: EMAIL_TEMPLATES.passwordChanged,
          to: user.email,
          subject: 'Your Password Has Been Changed',
          context: {
            lang: 'en' as const,
            username: user.email,
            currentYear: new Date().getFullYear(),
            changedAt: new Date().toISOString(),
          },
        },
        { removeOnComplete: true },
      );

      return {
        message: 'Password reset successful',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async forgetPasswordByLink(email: string, requestIp: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.checkRateLimit(user.id, RL_ACTION.password_reset_request);

    const uuidv4 = crypto.randomUUID();

    const token_combined = `${user.id}:${uuidv4}:${Date.now()}`;

    const hash = crypto
      .createHash('sha256')
      .update(token_combined)
      .digest('hex');

    const tokenEntity = this.tokenRepository.create({
      user_id: user.id,
      token: token_combined,
      type: TOKEN_TYPE.password_reset,
      expires_at: new Date(Date.now() + EXPIRED_RESET_PASSWORD),
    });

    await this.tokenRepository.delete({
      user_id: user.id,
      type: TOKEN_TYPE.password_reset,
    });

    await this.tokenRepository.save(tokenEntity);

    // Send magic link email for password reset (config auto-injected)
    const front_env = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetLink = `${front_env}/reset-password?token=${token_combined}`;

    const hash_token = crypto
      .createHash('sha256')
      .update(token_combined)
      .digest('hex');

    await this.emailQueue.add(
      'password-reset',
      {
        template: EMAIL_TEMPLATES.passwordReset,
        to: user.email,
        subject: 'Reset Your Password',
        context: {
          lang: 'en' as const,
          username: user.email,
          resetLink,
          expiryTime: '15 minutes',
          currentYear: new Date().getFullYear(),
        },
      },
      { removeOnComplete: true },
    );

    return { expires_in: new Date(Date.now() + EXPIRED_RESET_PASSWORD) };
  }

  async resetPasswordByLink(token: string, new_password: string) {
    const hash_token = crypto.createHash('sha256').update(token).digest('hex');

    const tokenEntity = await this.tokenRepository.findOne({
      where: {
        token: token,
        type: TOKEN_TYPE.password_reset,
      },
    });

    if (!tokenEntity) {
      this.logger.warn(
        `Password reset token not found or invalid: ${hash_token}`,
      );
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if token has expired
    if (new Date() > tokenEntity.expires_at) {
      this.logger.warn(
        `Password reset token expired for user ${tokenEntity.user_id}`,
      );
      await this.tokenRepository.delete({ id: tokenEntity.id });
      throw new BadRequestException(
        'Token has expired. Please request a new password reset.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: tokenEntity.user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isSamePassword = await bcrypt.compare(new_password, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      user.password = await bcrypt.hash(new_password, SALT_ROUNDS);

      if (user.password_reset_required) {
        user.password_reset_required = false;
      }

      await queryRunner.manager.save(User, user);

      // revoke all sessions and tokens
      await queryRunner.manager.update(
        Session,
        { user_id: user.id, is_active: true },
        {
          is_active: false,
          revoked_at: new Date(),
          revoke_reason: SESSION_REVOC_R.password_reset,
        },
      );

      await queryRunner.manager.delete(RefreshToken, { user_id: user.id });

      await queryRunner.manager.delete(Token, {
        id: tokenEntity.id,
        type: TOKEN_TYPE.password_reset,
      });

      await queryRunner.commitTransaction();
      // send email notification about password reset
      await this.emailQueue.add(
        'password-changed',
        {
          template: EMAIL_TEMPLATES.passwordChanged,
          to: user.email,
          subject: 'Your Password Has Been Changed',
          context: {
            lang: 'en' as const,
            username: user.email,
            changedAt: new Date().toISOString(),
            currentYear: new Date().getFullYear(),
          },
        },
        { removeOnComplete: true },
      );

      return {
        message: 'Password reset successful',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error resetting password', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendVerificationEmailByLink(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.checkRateLimit(user.id, RL_ACTION.confirm_email_request);

    const uuidv4 = crypto.randomUUID();
    const token_combined = `${user.id}:${uuidv4}:${Date.now()}`;
    const hash = crypto
      .createHash('sha256')
      .update(token_combined)
      .digest('hex');

    const tokenEntity = this.tokenRepository.create({
      user_id: user.id,
      token: hash,
      type: TOKEN_TYPE.email_verification,
      expires_at: new Date(Date.now() + EXPIRED_CONFIRM_EMAIL),
    });

    // Clean up any existing OTP tokens for this user
    await this.otpTokenRepository.delete({
      user_id: user.id,
      type: OTP_TYPE.email_verification,
    });

    await this.tokenRepository.save(tokenEntity);

    // Send verification email (config auto-injected)
    const front_env = this.configService.getOrThrow<string>('FRONTEND_URL');
    const verifyLink = `${front_env}/verify-email?token=${token_combined}`;

    await this.emailQueue.add(
      'verification',
      {
        template: EMAIL_TEMPLATES.verification,
        to: user.email,
        subject: 'Verify Your Email',
        context: {
          lang: 'en' as const,
          username: user.email,
          verificationLink: verifyLink,
          expiryTime: '24 hours',
          currentYear: new Date().getFullYear(),
        },
      },
      { removeOnComplete: true },
    );

    return { expires_in: new Date(Date.now() + EXPIRED_CONFIRM_EMAIL) };
  }

  async sendVerificationEmailByOtp(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.checkRateLimit(user.id, RL_ACTION.confirm_email_request);

    const token_id = crypto.randomUUID();

    const token = `${user.id}:${token_id}:${Date.now()}`;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const secret = new OTPAuth.Secret({ size: 20 });

    const appName = this.configService.getOrThrow<string>('APP_NAME');

    const totp = new OTPAuth.TOTP({
      label: user.email,
      issuer: appName,
      algorithm: 'SHA1',
      digits: 6,
      period: TOTP_PERIOD,
      secret: secret,
    });

    // Generate OTP
    const otp = totp.generate();
    const otpTokenEntity = this.otpTokenRepository.create({
      user_id: user.id,
      token: hash,
      type: OTP_TYPE.email_verification,
      otp_secret: secret.base32,
      expires_at: new Date(Date.now() + EXPIRED_OTP_EMAIL),
    });

    // Clean up any existing OTP tokens for this user
    await this.otpTokenRepository.delete({
      user_id: user.id,
      type: OTP_TYPE.email_verification,
    });

    await this.otpTokenRepository.save(otpTokenEntity);

    this.logger.log(
      `Email verification OTP generated for token ${token} , OTP: ${otp}`,
    );

    // Send OTP via email (config auto-injected)
    await this.emailQueue.add(
      'verification-otp',
      {
        template: EMAIL_TEMPLATES.verificationOTP,
        to: user.email,
        subject: 'Your Email Verification Code',
        context: {
          lang: 'en' as const,
          username: user.email,
          otpCode: otp,
          expiryTime: '5 minutes',
          currentYear: new Date().getFullYear(),
        },
      },
      { removeOnComplete: true },
    );

    return {
      message: 'OTP sent to your email',
      token: token,
      expires_in: new Date(Date.now() + EXPIRED_OTP_EMAIL),
    };
  }

  async confirmEmailByLink(token: string) {
    const hash_token = crypto.createHash('sha256').update(token).digest('hex');

    const tokenEntity = await this.tokenRepository.findOne({
      where: {
        token: hash_token,
        type: TOKEN_TYPE.email_verification,
      },
    });
    if (!tokenEntity) {
      throw new BadRequestException('Invalid or expired token');
    }
    const user = await this.userRepository.findOne({
      where: { id: tokenEntity.user_id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Email is already verified');
    }

    user.is_verified = true;
    await this.userRepository.save(user);

    await this.tokenRepository.delete({
      user_id: user.id,
      type: TOKEN_TYPE.email_verification,
    });

    return { message: 'Email successfully verified' };
  }

  async confirmEmailByOtp(token: string, otp_code: string) {
    const hash_token = crypto.createHash('sha256').update(token).digest('hex');

    const otpTokenEntity = await this.otpTokenRepository.findOne({
      where: {
        token: hash_token,
        type: OTP_TYPE.email_verification,
      },
    });

    if (!otpTokenEntity) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepository.findOne({
      where: { id: otpTokenEntity.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if token has expired
    if (new Date() > otpTokenEntity.expires_at) {
      this.logger.warn(
        `Email verification OTP token expired for user ${otpTokenEntity.user_id}`,
      );
      await this.otpTokenRepository.delete({ id: otpTokenEntity.id });
      throw new BadRequestException(
        'OTP has expired. Please request a new verification code.',
      );
    }

    const appName = this.configService.getOrThrow<string>('APP_NAME');
    const totp = new OTPAuth.TOTP({
      issuer: appName,
      label: user.email,
      secret: OTPAuth.Secret.fromBase32(otpTokenEntity.otp_secret),
      digits: 6,
      algorithm: 'SHA1',
      period: TOTP_PERIOD,
    });

    const isValid = totp.validate({
      token: otp_code,
      window: TOTP_WINDOW,
    });
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    user.is_verified = true;
    await this.userRepository.save(user);
    await this.otpTokenRepository.delete({
      user_id: user.id,
      type: OTP_TYPE.email_verification,
    });
    return { message: 'Email successfully verified' };
  }

  async sendChnageEmailRequest(
    user_id: number,
    new_email: string,
    password: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :user_id', { user_id })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email === new_email) {
      throw new BadRequestException(
        'New email cannot be the same as the current email',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: new_email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.checkRateLimit(user.id, RL_ACTION.change_email_request);

    const uuidv4 = crypto.randomUUID();

    const token_combined = `${user.id}:${new_email}:${uuidv4}:${Date.now()}`;

    const hash = crypto
      .createHash('sha256')
      .update(token_combined)
      .digest('hex');

    const tokenEntity = this.tokenRepository.create({
      user_id: user.id,
      token: hash,
      type: TOKEN_TYPE.change_email,
      expires_at: new Date(Date.now() + EXPIRED_CHANGE_EMAIL),
    });

    await this.tokenRepository.save(tokenEntity);

    // Send change email verification (config auto-injected)
    const front_env = this.configService.getOrThrow<string>('FRONTEND_URL');
    const changeEmailLink = `${front_env}/change-email?token=${token_combined}`;

    await this.emailQueue.add(
      'change-email',
      {
        template: EMAIL_TEMPLATES.changeEmail,
        to: new_email,
        subject: 'Confirm Your Email Change',
        context: {
          lang: 'en' as const,
          username: user.email,
          firstName: user.full_name || 'User',
          newEmail: new_email,
          confirmationLink: changeEmailLink,
          currentYear: new Date().getFullYear(),
        },
      },
      { removeOnComplete: true },
    );

    return { expires_in: new Date(Date.now() + EXPIRED_CHANGE_EMAIL) };
  }

  async changeEmail(token: string) {
    const hash_token = crypto.createHash('sha256').update(token).digest('hex');

    const tokenEntity = await this.tokenRepository.findOne({
      where: {
        token: hash_token,
        type: TOKEN_TYPE.change_email,
      },
    });

    if (!tokenEntity) {
      throw new BadRequestException('Invalid or expired token');
    }

    const new_email_part = token.split(':')[1];

    const user = await this.userRepository.findOne({
      where: { id: tokenEntity.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const old_email = user.email;
    try {
      user.email = new_email_part;
      await queryRunner.manager.save(User, user);

      //TODO: add to log email change history

      await queryRunner.manager.delete(Token, {
        id: tokenEntity.id,
        type: TOKEN_TYPE.change_email,
      });

      // invalidate all sessions and tokens after email change
      await queryRunner.manager.update(
        Session,
        { user_id: user.id, is_active: true },
        {
          is_active: false,
          revoked_at: new Date(),
          revoke_reason: SESSION_REVOC_R.email_change,
        },
      );

      await queryRunner.manager.delete(RefreshToken, {
        user_id: user.id,
      });

      await queryRunner.manager.delete(Token, {
        user_id: user.id,
      });

      await queryRunner.manager.delete(OtpToken, {
        user_id: user.id,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Send both email notifications using bulk
    await this.emailQueue.addBulk([
      {
        name: 'email-changed',
        data: {
          template: EMAIL_TEMPLATES.emailChanged,
          to: old_email,
          subject: 'Security Alert: Your Email Address Has Been Changed',
          context: {
            lang: 'en' as const,
            username: user.email,
            firstName: user.full_name || 'User',
            previousEmail: old_email,
            newEmail: new_email_part,
            changeDate: new Date().toLocaleDateString(),
            accountSettingsLink: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/settings`,
            currentYear: new Date().getFullYear(),
          },
        },
        opts: { removeOnComplete: true },
      },
      {
        name: 'email-changed',
        data: {
          template: EMAIL_TEMPLATES.emailChanged,
          to: user.email,
          subject: 'Your Email Address Has Been Confirmed',
          context: {
            lang: 'en' as const,
            username: user.email,
            firstName: user.full_name || 'User',
            previousEmail: old_email,
            newEmail: user.email,
            changeDate: new Date().toLocaleDateString(),
            accountSettingsLink: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/settings`,
            currentYear: new Date().getFullYear(),
          },
        },
        opts: { removeOnComplete: true },
      },
    ]);

    return { message: 'Email successfully changed' };
  }

  async setAuthenticationMethod(
    user_id: number,
    method: M2FAMethod,
    password: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :user_id', { user_id })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.is_m2fa_enabled === false) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (method === M2FA_METHOD.email_otp) {
      return { message: 'Email OTP  already enabled' };
    }

    if (method === M2FA_METHOD.totp) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const secret = speakeasy.generateSecret();

        let m2fa = await queryRunner.manager.findOne(M2FA, {
          where: { user_id: user.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!m2fa) {
          m2fa = queryRunner.manager.create(M2FA, {
            user_id: user.id,
            totp_secret: secret.base32,
          });
        } else {
          m2fa.totp_secret = secret.base32;
        }

        const appName = this.configService.getOrThrow<string>('APP_NAME');

        await queryRunner.manager.save(M2FA, m2fa);

        await queryRunner.commitTransaction();

        const url = speakeasy.otpauthURL({
          secret: secret.base32,
          label: `${appName}:${user.email}`,
          issuer: appName,
          encoding: 'base32',
        });

        const qr_code = await QRCode.toDataURL(url);
        return {
          method: M2FA_METHOD.totp,
          qr_code,
          secret: secret.base32,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    throw new BadRequestException(
      'Unsupported two-factor authentication method',
    );
  }

  async enableM2FA(
    user_id: number,
    session_id: number,
    res: Response,
    auth_type: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_m2fa_enabled === true) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    await this.userRepository.update(user_id, { is_m2fa_enabled: true });

    const { access_token, access_token_expires_at } = this.generateAccessToken({
      user_id: user.id,
      session_id: session_id,
      m2fa_authenticated: true,
      m2fa_required: true,
    });

    if (auth_type === 'cookie') {
      const cookieOptions = this.getCookieOptions();

      res.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
    } else {
      return {
        access_token,
        access_token_expires_at,
      };
    }
  }

  async disableM2FA(
    user_id: number,
    session_id: number,
    res: Response,
    auth_type: string,
    password: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :user_id', { user_id })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.is_m2fa_enabled === false) {
      throw new BadRequestException(
        'Two-factor authentication is already disabled',
      );
    }
    await this.userRepository.update(user_id, { is_m2fa_enabled: false });

    const { access_token, access_token_expires_at } = this.generateAccessToken({
      user_id: user.id,
      session_id: session_id,
      m2fa_authenticated: true,
      m2fa_required: false,
    });

    if (auth_type === 'cookie') {
      const cookieOptions = this.getCookieOptions();

      res.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
    } else {
      return {
        access_token,
        access_token_expires_at,
      };
    }
  }

  async sendM2FAOtp(user_id: number, requestIp: string) {
    const user = await this.userRepository.findOne({ where: { id: user_id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token_id = crypto.randomUUID();
    const token = `${user.id}:${token_id}:${Date.now()}`;
    const secret = new OTPAuth.Secret({ size: 20 });

    const appName = this.configService.getOrThrow<string>('APP_NAME');

    const totp = new OTPAuth.TOTP({
      issuer: appName || 'YourApp',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: TOTP_PERIOD,
      secret: secret,
    });

    // Generate OTP
    const otp = totp.generate();

    const otpData = JSON.stringify({
      secret: secret.base32,
      attempts: 0,
      created_at: Date.now(),
      email: user.email,
    });

    await this.redisClient.setex(
      `2fa-otp:${token}`,
      EXPIRED_OTP_EMAIL / 1000,
      otpData,
    );

    // Send OTP via email (config auto-injected)
    await this.emailQueue.add(
      'm2fa-otp',
      {
        template: EMAIL_TEMPLATES.m2faOTP,
        to: user.email,
        subject: 'Your Two-Factor Authentication Code',
        context: {
          lang: 'en' as const,
          username: user.email,
          firstName: user.full_name || 'User',
          currentYear: new Date().getFullYear(),
          otp: otp,
          expirationTime: Math.ceil(EXPIRED_OTP_EMAIL / 60000),
        },
      },
      { removeOnComplete: true },
    );

    return { token, expires_in: new Date(Date.now() + EXPIRED_OTP_EMAIL) };
  }

  async verifyM2FAOtp(
    user_id: number,
    otp_code: string,
    token: string,
    session_id: number,
    res: Response,
    auth_type: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: user_id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const key = `2fa-otp:${token}`;
    const otpDataStr = await this.redisClient.get(key);

    if (!otpDataStr) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const otpData = JSON.parse(otpDataStr);

    if (otpData.attempts >= 4) {
      await this.redisClient.del(key);
      throw new UnauthorizedException(
        'Too many invalid attempts. Request new OTP',
      );
    }

    const totp = new OTPAuth.TOTP({
      issuer: this.configService.getOrThrow<string>('APP_NAME') || 'YourApp',
      label: otpData.email,
      algorithm: 'SHA1',
      digits: 6,
      period: TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(otpData.secret),
    });

    const delta = totp.validate({
      token: otp_code,
      window: TOTP_WINDOW,
    });

    if (delta === null) {
      otpData.attempts += 1;
      const ttl = await this.redisClient.ttl(key);
      await this.redisClient.setex(
        key,
        ttl > 0 ? ttl : 60,
        JSON.stringify(otpData),
      );

      throw new UnauthorizedException(
        `Invalid OTP. ${4 - otpData.attempts} attempts remaining`,
      );
    }
    await this.redisClient.del(key);

    const {
      access_token,
      access_token_expires_at,
      refresh_token,
      refresh_token_expires_at,
    } = this.generateTokens({
      user_id: user.id,
      session_id,
      m2fa_authenticated: true,
      m2fa_required: true,
    });

    if (auth_type === 'cookie') {
      const cookieOptions = this.getCookieOptions();
      res.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });

      res.cookie('refresh', refresh_token, {
        ...cookieOptions,
        expires: refresh_token_expires_at,
      });
    } else {
      return {
        access_token,
        access_token_expires_at,
        refresh_token,
        refresh_token_expires_at,
      };
    }
  }

  async verifyM2FAAuthenticator(
    user_id: number,
    otp_code: string,
    session_id: number,
    res: Response,
    auth_type: string,
  ) {
    const m2fa = await this.m2faRepository.findOne({
      where: { user_id },
      select: ['totp_secret'],
    });

    if (!m2fa || !m2fa.totp_secret) {
      throw new BadRequestException(
        'Authenticator app not set up for two-factor authentication',
      );
    }

    const verified = speakeasy.totp.verify({
      secret: m2fa.totp_secret,
      encoding: 'base32',
      token: otp_code,
      window: TOTP_WINDOW,
    });
    if (!verified) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    const {
      access_token,
      access_token_expires_at,
      refresh_token,
      refresh_token_expires_at,
    } = this.generateTokens({
      user_id: user_id,
      session_id,
      m2fa_authenticated: true,
      m2fa_required: true,
    });
    if (auth_type === 'cookie') {
      const cookieOptions = this.getCookieOptions();
      res.cookie('authentication', access_token, {
        ...cookieOptions,
        expires: access_token_expires_at,
      });
      res.cookie('refresh', refresh_token, {
        ...cookieOptions,
        expires: refresh_token_expires_at,
      });
    } else {
      return {
        access_token,
        access_token_expires_at,
        refresh_token,
        refresh_token_expires_at,
      };
    }
  }

  async me(user_id: number, dto: OptionUserDto) {
    const user = await this.usersService.me(user_id, dto);
    return user;
  }

  async updateMe(user_id: number, dto: UpdateUserMeDto) {
    const user = await this.usersService.updateMe(user_id, dto);
    return user;
  }

  async SoftDeleteMe(user_id: number) {
    return this.usersService.softDeleteMe(user_id);
  }

  async restoreMe(user_id: number) {
    return await this.usersService.restoreMe(user_id);
  }

  async updateMySettings(user_id: number, dto: UpdateUserSettingsMeDto) {
    return this.usersService.updateUserSettingsMe(user_id, dto);
  }
}
