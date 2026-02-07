import { IsString } from 'class-validator';

export class SendOfferDto {
  @IsString()
  room_id: string;

  offer: any;
}
