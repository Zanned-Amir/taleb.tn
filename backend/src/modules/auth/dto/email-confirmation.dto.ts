import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class EmailConfirmationDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ConfirmEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ConfirmEmailOTPDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be a 6-digit numeric code',
  })
  otp_code: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
