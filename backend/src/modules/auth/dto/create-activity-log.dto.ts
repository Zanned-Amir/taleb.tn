import { ActivityLogAction } from '../types/auth.types';

export class CreateActivityLogDto {
  user_id: string;

  action: ActivityLogAction;

  session_id?: string;

  ip_address?: string;

  user_agent?: string;

  country?: string;

  changes?: {
    field?: string;
    old_value?: any;
    new_value?: any;
  };

  description?: string;

  status?: string;

  metadata?: Record<string, any>;
}
