import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { AuthorizationService } from '../services/authorization.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    console.log(
      'WsAuthorizationGuard: Checking authorization for WebSocket request',
    );

    const Socket = context.switchToWs().getClient();
    const user: User = Socket.user;

    console.log('WsAuthorizationGuard: Retrieved user from socket:', user);

    if (!user) {
      throw new WsException('User not authenticated');
    }

    const result = await this.authorizationService.authorize(user, context);

    if (!result.allowed) {
      throw new WsException({
        message: result.reason || 'Access denied',
        requiresAction: result.requiresAction,
        metadata: result.metadata,
      });
    }

    return true;
  }
}
