import { IsBoolean, ValidateIf } from 'class-validator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';

export class ResetUserPasswordDto {
  @ValidateIf((obj) => !obj.auto_generate_password)
  @IsPasswordPolicy()
  new_password: string;

  @IsBoolean()
  auto_generate_password: boolean;
}
