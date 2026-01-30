import { IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SuspendUserDto {
  @Type(() => Date)
  @IsDate()
  suspension_ends_at: Date;

  @IsString()
  reason: string;
}
