import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class M2FAAlreadyVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has already completed M2FA for this session
    if (user && user.m2fa_authenticated === true) {
      throw new BadRequestException(
        'Two-factor authentication already verified for this session',
      );
    }

    if (user.is_m2fa_enabled !== true) {
      throw new BadRequestException(
        'Two-factor authentication is not enabled for your account',
      );
    }

    return true;
  }
}
