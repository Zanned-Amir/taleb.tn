// decorators/oauth-profile.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetOAuthProfile = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.oauth_profile;
  },
);
