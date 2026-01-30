import { Module } from '@nestjs/common';
import { GlobalGuard } from './guards/global.guard';
import { PasswordPolicyValidator } from './decorator/password-policy.decorator';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PasswordPolicyValidator, GlobalGuard],
  exports: [PasswordPolicyValidator, GlobalGuard],
})
export class CommonModule {}
