import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_BLOCKED } from 'src/common/decorator/blocked.decorator';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { SKIP_M2FA_KEY } from '../dto/account.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Check if route is public FIRST, before attempting JWT validation
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if route is blocked
    const isBlocked = this.reflector.getAllAndOverride<boolean>(IS_BLOCKED, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isBlocked) {
      throw new HttpException('Endpoint is blocked', HttpStatus.FORBIDDEN);
    }

    // Now validate JWT token
    const result = await super.canActivate(context);

    if (!result) {
      return false;
    }

    // User is now authenticated and available
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const skipM2FA = this.reflector.getAllAndOverride<boolean>(SKIP_M2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check M2FA requirement
    if (skipM2FA) {
      return true;
    }
    if (user && user.m2fa_required && !user.m2fa_authenticated) {
      throw new UnauthorizedException(
        'Two-factor authentication (M2FA) is required for this action',
      );
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Customize your error messages based on the error type
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Your session has expired. Please log in again',
        );
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid authentication token');
      }

      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token is not active yet');
      }

      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Authentication token is required');
      }

      // Default message for other auth failures
      throw new UnauthorizedException(
        'Authentication failed. Please provide a valid token',
      );
    }

    return user;
  }
}
