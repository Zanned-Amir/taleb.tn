import { PartialType } from '@nestjs/swagger';
import { CreateSettingsDto } from './create-settings.dto';

export class UpdateUserSettingsDto extends PartialType(CreateSettingsDto) {}

export class UpdateUserSettingsMeDto extends PartialType(CreateSettingsDto) {}
