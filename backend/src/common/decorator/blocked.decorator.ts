import { SetMetadata } from '@nestjs/common';

export const IS_BLOCKED = 'isBlocked';
export const Blocked = () => SetMetadata(IS_BLOCKED, true);
