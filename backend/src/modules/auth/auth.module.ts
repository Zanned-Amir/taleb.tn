import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.stratgey';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpToken } from './entites/otp-token.entity';
import { Token } from './entites/token.entity';
import { M2FA } from './entites/m2fa.entity';
import { RefreshToken } from './entites/refresh-token.entity';
import { Session } from '../sessions/entities/session.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from '../email/types/email.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Session,
      RefreshToken,
      M2FA,
      Token,
      OtpToken,
    ]),
    JwtModule,
    PassportModule,
    UsersModule,
    RedisModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalAuthGuard,
    JwtRefreshAuthGuard,
    JwtAuthGuard,
    AuthorizationGuard,
  ],
  exports: [AuthService, JwtAuthGuard, AuthorizationGuard],
})
export class AuthModule {}
