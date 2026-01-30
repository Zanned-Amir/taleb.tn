import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmChangeEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'token is required' })
  token: string;
}
