import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';
import { type M2FAMethod } from '../types/auth.types';

export class VerifyM2FAOtpDto {
  @Length(6, 6)
  @IsString()
  otp_code: string;

  @IsString()
  token: string;

  @IsIn(['header', 'cookie'])
  auth_type: string;
}

export class M2FADto {
  @IsIn(['header', 'cookie'])
  auth_type: string;
}

export class SetM2FAAuthenticationMethodDto {
  @IsIn(['totp', 'backup_code'])
  method: M2FAMethod;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class DisableM2FADto extends M2FADto {
  @IsNotEmpty()
  @IsString()
  password: string;
}
