import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  full_name: string;

  @ValidateIf((obj) => !obj.auto_generate_password)
  @IsPasswordPolicy()
  password: string;

  @IsArray()
  @IsNumber({}, { each: true })
  roles?: number[];

  @IsOptional()
  @IsPhoneNumber()
  phone_number?: string;

  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @IsBoolean()
  @IsOptional()
  is_m2fa_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  auto_generate_password?: boolean;
}

export class CreateUserBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}
