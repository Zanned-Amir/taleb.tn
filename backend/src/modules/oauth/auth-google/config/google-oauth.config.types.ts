import { IsString, IsBoolean, ValidateIf } from 'class-validator';

/**
 * Google OAuth Configuration Type
 */
export type GoogleOAuthConfig = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

/**
 * Google OAuth Configuration Validation
 */
export class GoogleOAuthConfigValidation {
  @IsBoolean()
  enabled: boolean;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  clientId: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  clientSecret: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  callbackUrl: string;
}
