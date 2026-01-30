import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { REDIS_CLIENT } from './constant/redis.constant';

@Module({
  providers: [RedisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
