import { IsIn } from 'class-validator';
import { SESSION_REVOC_R } from '../types/session.types';

export class RevokeSessionDto {
  @IsIn(Object.values(SESSION_REVOC_R))
  revoke_reason: string;
}
