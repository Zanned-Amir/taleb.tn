import { IsString, IsBoolean, ValidateIf } from 'class-validator';

/**
 * GitHub OAuth Configuration Type
 */
export type GitHubOAuthConfig = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

/**
 * GitHub OAuth Configuration Validation
 */
export class GitHubOAuthConfigValidation {
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
