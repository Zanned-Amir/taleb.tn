import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './config/env.config';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RedisModule } from './modules/redis/redis.module';
import * as path from 'path';
// Entities
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/users/entities/role.entity';
import { UserSettings } from './modules/users/entities/user-settings.entity';
import { Session } from './modules/sessions/entities/session.entity';
import { ActivityLog } from './modules/auth/entites/activity-log.entity';
import { Token } from './modules/auth/entites/token.entity';
import { RefreshToken } from './modules/auth/entites/refresh-token.entity';
import { OtpToken } from './modules/auth/entites/otp-token.entity';
import { M2FA } from './modules/auth/entites/m2fa.entity';
import { APP_GUARD } from '@nestjs/core';
import { GlobalGuard } from './common/guards/global.guard';
import { CommonModule } from './common/common.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },

      viewEngine: 'hbs',
      typesOutputPath: join(
        __dirname,
        '../src/i18n/generated/i18n.generated.ts',
      ),
      resolvers: [new QueryResolver(['lang']), new AcceptLanguageResolver()],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.getOrThrow<string>('DATABASE_HOST'),
          port: configService.getOrThrow<number>('DATABASE_PORT'),
          username: configService.getOrThrow<string>('DATABASE_USER'),
          password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
          database: configService.getOrThrow<string>('DATABASE_NAME'),
          entities: [
            User,
            Role,
            UserSettings,
            Session,
            ActivityLog,
            Token,
            RefreshToken,
            OtpToken,
            M2FA,
          ],
          synchronize:
            configService.getOrThrow<string>('NODE_ENV') !== 'production',
          ssl:
            configService.getOrThrow<string>('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : false,
          cache: {
            type: 'ioredis',
            options: {
              host: configService.getOrThrow<string>('REDIS_HOST'),
              port: configService.getOrThrow<number>('REDIS_PORT'),
              password: configService.getOrThrow<string>('REDIS_PASSWORD'),
            },
          },
        };
      },
    }),

    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.getOrThrow<string>('BULLMQ_REDIS_HOST'),
            port: configService.getOrThrow<number>('BULLMQ_REDIS_PORT'),
            password: configService.getOrThrow<string>('BULLMQ_REDIS_PASSWORD'),
            db: configService.getOrThrow<number>('BULLMQ_REDIS_DB'),
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    EmailModule,
    AuthModule,
    SessionsModule,
    RedisModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalGuard,
    },

    AppService,
  ],
})
export class AppModule {}
