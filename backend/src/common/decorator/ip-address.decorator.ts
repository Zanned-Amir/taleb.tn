import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import * as requestIp from 'request-ip';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return requestIp.getClientIp(request) || 'unknown';
  },
);
