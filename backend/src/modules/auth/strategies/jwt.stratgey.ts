import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from '../types/auth.interfaces';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const tokenFromCookie = req.cookies?.authentication;
          const authHeader = req.headers?.authorization;

          const tokenFromHeader =
            typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
              ? authHeader.replace('Bearer ', '')
              : undefined;

          return tokenFromCookie || tokenFromHeader;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AccessTokenPayload) {
    const session_id = payload.session_id;
    if (session_id) {
      req.headers['x-session-id'] = session_id.toString();
    }
    const user = await this.authService.getUserJwt(payload.user_id);

    // Attach M2FA authentication state to user object
    (user as any).m2fa_authenticated = payload.m2fa_authenticated;
    (user as any).m2fa_required = payload.m2fa_required;
    return user;
  }
}
