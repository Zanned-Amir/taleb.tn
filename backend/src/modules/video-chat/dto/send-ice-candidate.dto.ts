import { IsString } from 'class-validator';

export class SendIceCandidateDto {
  @IsString()
  room_id: string;

  candidate: any;
}
