import { Module } from '@nestjs/common';
import { Session } from './entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
