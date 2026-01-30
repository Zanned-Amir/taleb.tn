import { OmitType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';
import { IsIn, IsOptional } from 'class-validator';
import { ACCOUNT_STATUS, type AccountStatusType } from '../types/users.types';

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'email',
  'password',
  'auto_generate_password',
  'roles',
] as const) {
  @IsIn(Object.values(ACCOUNT_STATUS))
  status: AccountStatusType;
}

export class UpdateUserMeDto {
  @IsOptional()
  full_name?: string;
}
