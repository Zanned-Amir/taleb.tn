import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { RefreshTokenPayload } from '../types/auth.interfaces';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const fromCookie = req.cookies?.refresh;
          const fromHeader = req.headers['x-refresh-token'];
          return typeof fromHeader === 'string' ? fromHeader : fromCookie;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: RefreshTokenPayload) {
    const refresh_token =
      (typeof request.headers['x-refresh-token'] === 'string'
        ? request.headers['x-refresh-token']
        : request.cookies?.refresh) ?? null;

    if (!refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { user_id, session_id, m2fa_authenticated, m2fa_required } = payload;

    if (m2fa_required && !m2fa_authenticated) {
      throw new UnauthorizedException(
        'Two-factor authentication (M2FA) is required for this action',
      );
    }

    const user = (await this.authService.verifyRefreshToken(
      refresh_token,
      user_id,
      session_id,
    )) as any;

    // Set session_id in request headers for @SessionId() decorator
    if (session_id) {
      request.headers['x-session-id'] = session_id.toString();
    }

    // Attach M2FA data from token payload to user object
    user.m2fa_authenticated = m2fa_authenticated;
    user.m2fa_required = m2fa_required;

    return user;
  }
}
