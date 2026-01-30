import { IsBoolean } from 'class-validator';
import { IsPasswordPolicy } from 'src/common/decorator/password-policy.decorator';

export class changePasswordDto {
  @IsPasswordPolicy()
  new_password: string;

  @IsPasswordPolicy()
  current_password: string;

  @IsBoolean()
  logout_all: boolean = false;
}
