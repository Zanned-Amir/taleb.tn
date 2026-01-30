import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './constant/redis.constant';

export const RedisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.getOrThrow<string>('REDIS_HOST'),
      port: configService.getOrThrow<number>('REDIS_PORT', 6379),
      password: configService.getOrThrow<string | undefined>(
        'REDIS_PASSWORD',
        undefined,
      ),
      db: configService.getOrThrow<number>('REDIS_DB', 0),
    });
  },

  inject: [ConfigService],
};
