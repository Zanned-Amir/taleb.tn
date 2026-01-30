import { Session } from '../entities/session.entity';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const sessionPaginationConfig: PaginateConfig<Session> = {
  sortableColumns: ['created_at', 'updated_at', 'revoked_at'],
  searchableColumns: ['device_fingerprint', 'ip_address', 'user_agent'],
  defaultSortBy: [
    ['last_activity_at', 'DESC'],
    ['created_at', 'DESC'],
  ],
  filterableColumns: {
    id: [FilterOperator.EQ],
    user_id: [FilterOperator.EQ],
    created_at: [FilterOperator.GTE, FilterOperator.LTE],
    updated_at: [FilterOperator.GTE, FilterOperator.LTE],
    revoked_at: [FilterOperator.GTE, FilterOperator.LTE],
    revoke_reason: [FilterOperator.EQ, FilterOperator.IN],
    is_active: [FilterOperator.EQ],
  },
  maxLimit: 100,
  relations: ['user'],
};
