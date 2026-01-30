import { IsBoolean, IsOptional } from 'class-validator';

export class OptionUserDto {
  @IsOptional()
  @IsBoolean()
  include_roles?: boolean;

  @IsOptional()
  @IsBoolean()
  include_settings?: boolean;

  @IsOptional()
  @IsBoolean()
  include_sessions?: boolean = false;

  @IsOptional()
  @IsBoolean()
  include_oauth_accounts?: boolean = false;
}

export class OptionUserAdminDto extends OptionUserDto {
  @IsOptional()
  @IsBoolean()
  include_deleted?: boolean;
}
