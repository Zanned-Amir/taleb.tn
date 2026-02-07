import { IsString } from 'class-validator';

export class SendAnswerDto {
  @IsString()
  room_id: string;

  answer: any;
}
