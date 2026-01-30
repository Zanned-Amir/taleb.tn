import { IsBoolean, IsIn, IsString } from 'class-validator';
import { SETTINGS_LANGUAGE, SETTINGS_THEME } from '../types/users.types';

export class CreateSettingsDto {
  @IsIn(Object.values(SETTINGS_THEME))
  theme: string;

  @IsBoolean()
  notifications_enabled: boolean;

  @IsString()
  @IsIn(Object.values(SETTINGS_LANGUAGE))
  language: string;
}
