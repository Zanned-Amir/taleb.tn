import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { User } from '../entities/user.entity';
export const usersPaginateConfig: PaginateConfig<User> = {
  sortableColumns: ['id', 'email', 'created_at', 'updated_at', 'deleted_at'],
  searchableColumns: ['email'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.IN],
    email: [FilterOperator.EQ, FilterOperator.ILIKE],
    created_at: [FilterOperator.GTE, FilterOperator.LTE],
    updated_at: [FilterOperator.GTE, FilterOperator.LTE],
    deleted_at: [FilterOperator.GTE, FilterOperator.LTE],
    full_name: [FilterOperator.ILIKE, FilterOperator.EQ],
  },
};
