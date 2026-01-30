import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Handle specific refresh token errors
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token has expired. Please log in again',
        );
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Refresh token is not active yet');
      }

      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Refresh token is required');
      }

      // If there's an original error, prioritize it
      if (err) {
        console.error('JWT Refresh Guard Error:', err);
        throw new UnauthorizedException(
          err.message || 'Refresh token validation failed',
        );
      }

      // Default message for refresh token failures
      throw new UnauthorizedException(
        'Invalid or expired refresh token. Please log in again',
      );
    }

    return user;
  }
}
