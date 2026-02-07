import { IsString } from 'class-validator';

export class LeaveRoomDto {
  @IsString()
  room_id: string;
}
