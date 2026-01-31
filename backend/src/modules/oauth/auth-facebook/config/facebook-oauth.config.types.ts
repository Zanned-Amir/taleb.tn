import { IsString, IsBoolean, ValidateIf } from 'class-validator';

/**
 * Facebook OAuth Configuration Type
 */
export type FacebookOAuthConfig = {
  enabled: boolean;
  appId: string;
  appSecret: string;
  callbackUrl: string;
};

/**
 * Facebook OAuth Configuration Validation
 */
export class FacebookOAuthConfigValidation {
  @IsBoolean()
  enabled: boolean;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  appId: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  appSecret: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  callbackUrl: string;
}
