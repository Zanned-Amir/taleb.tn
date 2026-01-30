import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class verifyPasswordDto {
  @IsPasswordPolicy()
  password: string;
}
