import { SetMetadata } from '@nestjs/common';

export const SKIP_EMAIL_VERIFIED_KEY = 'skipEmailVerified';
export const REQUIRE_PHONE_VERIFIED_KEY = 'requirePhoneVerified';
export const REQUIRE_M2FA_KEY = 'requireM2FA';
export const SKIP_M2FA_KEY = 'skipM2FA';

export const SkipEmailVerified = () =>
  SetMetadata(SKIP_EMAIL_VERIFIED_KEY, true);

export const RequirePhoneVerified = () =>
  SetMetadata(REQUIRE_PHONE_VERIFIED_KEY, true);

export const RequireM2FA = () => SetMetadata(REQUIRE_M2FA_KEY, true);

export const SkipM2FA = () => SetMetadata(SKIP_M2FA_KEY, true);
