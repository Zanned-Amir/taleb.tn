import { Module } from '@nestjs/common';
import { VideoChatGateway } from './video-chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [VideoChatGateway],
})
export class VideoChatModule {}
