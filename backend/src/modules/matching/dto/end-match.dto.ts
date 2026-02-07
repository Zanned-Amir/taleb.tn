import { IsString } from 'class-validator';

export class EndMatchDto {
  @IsString()
  match_id: string;
}
