import { IsIn, IsString, Length } from 'class-validator';

export class VerifyM2FATotpDto {
  @Length(6, 6)
  @IsString()
  otp_code: string;

  @IsIn(['header', 'cookie'])
  auth_type: string;
}
