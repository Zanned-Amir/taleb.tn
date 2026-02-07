import { Module } from '@nestjs/common';
import { MatchingGateway } from './matching.gateway';
import { MatchingService } from './matching.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  providers: [MatchingGateway, MatchingService],
})
export class MatchingModule {}
