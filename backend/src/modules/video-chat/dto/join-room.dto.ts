import { IsString } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  room_id: string;

  @IsString()
  match_id: string;
}
