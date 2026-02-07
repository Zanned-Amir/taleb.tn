// auth/middlewares/ws-auth.middleware.ts
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AccessTokenPayload } from '../types/auth.interfaces';

export class WsAuthMiddleware {
  private readonly logger = new Logger('WsAuth');

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  use() {
    return async (socket: Socket, next: (err?: Error) => void) => {
      try {
        // Extract token from auth object or headers
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split('Bearer ')[1];

        if (!token) {
          this.logger.warn(`Connection rejected: No jwt token provided`);
          return next(new Error('Unauthorized: No jwt token provided'));
        }

        // Verify token
        const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
          token,
          {
            secret: process.env.JWT_SECRET,
          },
        );

        // Validate user exists
        const user = await this.authService.getUserJwt(payload.user_id);
        if (!user) {
          this.logger.warn(
            `Connection rejected: User ${payload.user_id} not found`,
          );
          return next(new Error('Unauthorized: User not found'));
        }

        // Attach M2FA data from token payload
        (user as any).m2fa_authenticated = payload.m2fa_authenticated;
        (user as any).m2fa_required = payload.m2fa_required;

        // Attach user to socket data
        (socket as any).user = user;

        this.logger.log(
          `Client authenticated: ${socket.id} (User: ${user.id})`,
        );
        next();
      } catch (err: any) {
        let errorMessage: Error;

        // Handle specific JWT errors
        if (err?.name === 'TokenExpiredError') {
          errorMessage = new Error(
            'Your session has expired. Please log in again',
          );
        } else if (err?.name === 'JsonWebTokenError') {
          errorMessage = new Error('Invalid authentication token');
        } else if (err?.name === 'NotBeforeError') {
          errorMessage = new Error('Token is not active yet');
        } else if (err?.message === 'No auth token') {
          errorMessage = new Error('Authentication token is required');
        } else {
          // Default message for other auth failures
          errorMessage = new Error(
            'Authentication failed. Please provide a valid token',
          );
        }

        next(errorMessage);
      }
    };
  }
}
