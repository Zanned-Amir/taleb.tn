import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthorizationGuard } from '../../modules/auth/guards/authorization.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@Injectable()
export class GlobalGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private authGuard: AuthorizationGuard,
  ) {}

  async canActivate(context: ExecutionContext) {
    await this.jwtGuard.canActivate(context);
    await this.authGuard.canActivate(context);

    return true;
  }
}
