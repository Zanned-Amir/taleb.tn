// auth/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from 'src/modules/auth/types/auth.types';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirement {
  resource: Resource;
  actions: Action[];
}

export const Permissions = (permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Permission = (resource: Resource, ...actions: Action[]) =>
  Permissions([{ resource, actions }]);
