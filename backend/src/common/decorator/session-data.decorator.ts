import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import * as requestIp from 'request-ip';
import { SessionDto } from '../../modules/auth/dto/session.dto';

export const GetSessionData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SessionDto => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return {
      user_agent: request.headers['user-agent'] || null,
      ip_address: requestIp.getClientIp(request),
      device_fingerprint:
        (request.headers['x-device-fingerprint'] as string) ||
        (request.body?.device_fingerprint as string) ||
        null,
    } as SessionDto;
  },
);
