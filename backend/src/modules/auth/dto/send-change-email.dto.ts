import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendChangeEmailDto {
  @IsEmail()
  @IsNotEmpty({ message: 'new_email is required' })
  new_email: string;

  @IsString()
  password: string;
}
