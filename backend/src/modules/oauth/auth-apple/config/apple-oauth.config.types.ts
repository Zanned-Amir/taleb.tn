import { IsString, IsBoolean, ValidateIf } from 'class-validator';

/**
 * Apple OAuth Configuration Type
 */
export type AppleOAuthConfig = {
  enabled: boolean;
  teamId: string;
  clientId: string;
  keyId: string;
  privateKey: string;
  callbackUrl: string;
};

/**
 * Apple OAuth Configuration Validation
 */
export class AppleOAuthConfigValidation {
  @IsBoolean()
  enabled: boolean;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  teamId: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  clientId: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  keyId: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  privateKey: string;

  @ValidateIf((o) => o.enabled === true)
  @IsString()
  callbackUrl: string;
}
