import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RevokeSessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const session_id_to_revoke = request.params['id'];
    const current_session_id = request.headers['x-session-id'];

    if (current_session_id !== session_id_to_revoke) {
      throw new ForbiddenException('You cannot revoke your current session');
    }

    return true;
  }
}
