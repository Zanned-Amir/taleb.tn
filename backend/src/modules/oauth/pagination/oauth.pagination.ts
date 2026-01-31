import { PaginateConfig, FilterOperator } from 'nestjs-paginate';
import { OAuthAccount } from '../entities/oauth_account.entity';

export const oauthAccountPaginationConfig: PaginateConfig<OAuthAccount> = {
  sortableColumns: ['created_at', 'updated_at'],
  searchableColumns: ['provider_email', 'provider_account_id'],
  defaultSortBy: [['created_at', 'DESC']],
  filterableColumns: {
    id: [FilterOperator.EQ],
    user_id: [FilterOperator.EQ],
    provider: [FilterOperator.EQ],
    provider_account_id: [FilterOperator.EQ],
    is_active: [FilterOperator.EQ],
    provider_email: [FilterOperator.EQ, FilterOperator.IN],
    created_at: [FilterOperator.GTE, FilterOperator.LTE],
    updated_at: [FilterOperator.GTE, FilterOperator.LTE],
  },
  maxLimit: 100,
  relations: ['user'],
};
