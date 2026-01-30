import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';

// v1 dto for reset password  by magic link
export class ResetPasswordV1Dto {
  @IsString()
  @IsNotEmpty()
  token: string;


  @IsPasswordPolicy()
  new_password: string;
}

export class ResetPasswordV2Dto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsNumberString()
  @Length(6, 6, {
    message: 'OTP code must be 6 digits',
  })
  @IsNotEmpty()
  otp_code: string;

  @IsPasswordPolicy()
  new_password: string;
}
