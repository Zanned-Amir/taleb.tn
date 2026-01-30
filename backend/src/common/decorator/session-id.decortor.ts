import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest();
    return Number(request.headers['x-session-id']) || null;
  },
);

export { SessionId };
