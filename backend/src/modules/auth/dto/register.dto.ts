import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { IsValidCountryCode } from 'src/common/decorator/is-valide-country-code.decorator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsPasswordPolicy()
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  full_name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone_number?: string;

  @IsOptional()
  @IsValidCountryCode()
  country_code?: string;
}
