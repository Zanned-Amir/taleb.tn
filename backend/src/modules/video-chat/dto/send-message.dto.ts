import { IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  room_id: string;

  @IsString()
  message: string;
}
