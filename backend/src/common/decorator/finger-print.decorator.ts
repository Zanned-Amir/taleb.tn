import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const DeviceFingerPrint = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      (request.headers['x-device-fingerprint'] as string) ||
      (request.body?.device_fingerprint as string) ||
      null
    );
  },
);
