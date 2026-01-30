import {
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsValidCountryCode } from 'src/common/decorator/is-valide-country-code.decorator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone_number?: string;

  @IsOptional()
  @IsValidCountryCode()
  country_code?: string;
}
