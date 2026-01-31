import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { AUTH_ACTION } from '../types/auth.types';
import { UsersService } from 'src/modules/users/users.service';
import { ACCOUNT_STATUS } from 'src/modules/users/types/users.types';
import {
  PermissionRequirement,
  PERMISSIONS_KEY,
} from 'src/common/decorator/permissions.decorator';
import {
  REQUIRE_M2FA_KEY,
  SKIP_EMAIL_VERIFIED_KEY,
} from '../dto/account.decorator';

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiresAction?: (typeof AUTH_ACTION)[keyof typeof AUTH_ACTION];
  metadata?: Record<string, any>;
}

type UserData = User & {
  m2fa_authenticated?: boolean;
  m2fa_required?: boolean;
};

@Injectable()
export class AuthorizationService {
  private readonly SOFT_DELETE_RESTORE_DAYS = 14;

  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Main authorization check - validates all user account requirements
   */
  async authorize(
    user: UserData,
    context: ExecutionContext,
  ): Promise<AuthorizationResult> {
    // 1. Check soft delete status
    const deleteCheck = this.checkSoftDelete(user);
    if (!deleteCheck.allowed) return deleteCheck;

    // 2. Check account status
    const statusCheck = await this.checkAccountStatus(user);
    if (!statusCheck.allowed) return statusCheck;

    // 3. Check email verification (unless skipped)
    const skipEmailVerified = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMAIL_VERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!skipEmailVerified) {
      const emailCheck = this.checkEmailVerification(user);
      if (!emailCheck.allowed) return emailCheck;
    }
    // 4. Check required roles
    const requireM2FA = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_M2FA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireM2FA) {
      const m2faCheck = this.checkM2FA(user, requireM2FA);
      if (!m2faCheck.allowed) return m2faCheck;
    }

    // 5. Check required roles
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (requiredPermissions && requiredPermissions.length > 0) {
      const permissionCheck = this.checkPermissions(user, requiredPermissions);
      if (!permissionCheck.allowed) return permissionCheck;
    }

    return { allowed: true };
  }

  /**
   * Check if user is soft deleted and within restore period
   */
  private checkSoftDelete(user: UserData): AuthorizationResult {
    if (!user.deleted_at) {
      return { allowed: true };
    }

    const deletedDate = new Date(user.deleted_at);
    const now = new Date();
    const daysSinceDelete = Math.floor(
      (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceDelete > this.SOFT_DELETE_RESTORE_DAYS) {
      return {
        allowed: false,
        reason: `Account was deleted more than ${this.SOFT_DELETE_RESTORE_DAYS} days ago and cannot be restored`,
        requiresAction: AUTH_ACTION.contact_support,
        metadata: {
          deleted_at: user.deleted_at,
          days_since_delete: daysSinceDelete,
        },
      };
    }

    return {
      allowed: false,
      reason: `Account is deleted. You have ${this.SOFT_DELETE_RESTORE_DAYS - daysSinceDelete} days left to restore it`,
      requiresAction: AUTH_ACTION.restore_account,
      metadata: {
        deleted_at: user.deleted_at,
        days_remaining: this.SOFT_DELETE_RESTORE_DAYS - daysSinceDelete,
      },
    };
  }

  /**
   * Check account status
   */
  private async checkAccountStatus(
    user: UserData,
  ): Promise<AuthorizationResult> {
    switch (user.status) {
      case ACCOUNT_STATUS.active:
        return { allowed: true };

      case ACCOUNT_STATUS.inactive:
        return {
          allowed: true,
          requiresAction: AUTH_ACTION.verify_email,
        };

      case ACCOUNT_STATUS.suspended:
        const now = new Date();
        const suspensionEnd = user.suspension_ends_at;
        if (suspensionEnd && now > suspensionEnd) {
          await this.usersService.unsuspendUser(user.id);
          return { allowed: true };
        }
        const reason = user.suspension_reason
          ? ` Reason: ${user.suspension_reason}`
          : '';

        const fullReason = `Your account has been suspended until ${suspensionEnd?.toISOString()}.${reason}`;
        return {
          allowed: false,
          reason: fullReason,
          requiresAction: AUTH_ACTION.contact_support,
          metadata: { account_status: user.status },
        };

      case ACCOUNT_STATUS.deactivated:
        return {
          allowed: false,
          reason: 'Account has been deactivated. Please reactivate to continue',
          requiresAction: AUTH_ACTION.reactivate_account,
          metadata: { account_status: user.status },
        };

      case ACCOUNT_STATUS.soft_deleted:
        return {
          allowed: false,
          reason: 'Account is deleted. Please restore to continue',
          requiresAction: AUTH_ACTION.restore_account,
          metadata: { account_status: user.status },
        };

      default:
        return {
          allowed: false,
          reason: 'Unknown account status',
          requiresAction: AUTH_ACTION.contact_support,
          metadata: { account_status: user.status },
        };
    }
  }

  /**
   * Check email verification
   */
  private checkEmailVerification(user: UserData): AuthorizationResult {
    if (user.is_verified) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Email address is not verified',
      requiresAction: AUTH_ACTION.verify_email,
      metadata: {
        email: user.email,
        is_verified: user.is_verified,
      },
    };
  }

  /**
   * Check M2FA status
   */
  private checkM2FA(
    user: UserData,
    requireM2FA?: boolean,
  ): AuthorizationResult {
    // If M2FA is explicitly required by decorator
    if (requireM2FA && !user.is_m2fa_enabled) {
      return {
        allowed: false,
        reason: 'Two-factor authentication (M2FA) is required for this action',
        requiresAction: AUTH_ACTION.enable_m2fa,
        metadata: { m2fa_enabled: user.is_m2fa_enabled },
      };
    }

    // Check if M2FA challenge was completed in current session

    if (user.m2fa_required && !user.m2fa_authenticated) {
      return {
        allowed: false,
        reason: 'M2FA verification required for this session',
        requiresAction: AUTH_ACTION.verify_m2fa,
        metadata: {
          m2fa_enabled: user.is_m2fa_enabled,
          m2fa_authenticated: user.m2fa_authenticated,
        },
      };
    }

    return { allowed: true };
  }

  private checkRoles(
    user: UserData,
    requiredRoles: string[],
  ): AuthorizationResult {
    if (!user.roles || user.roles.length === 0) {
      return {
        allowed: false,
        reason: 'User has no roles assigned',
        metadata: { required_roles: requiredRoles },
      };
    }

    const userRoleCodes = user.roles.map((role) => role.name);
    // check if user has all required roles
    const hasRequiredRole = requiredRoles.every((role) =>
      userRoleCodes.includes(role),
    );

    if (!hasRequiredRole) {
      return {
        allowed: false,
        reason: 'User does not have the required roles',
        metadata: {
          user_roles: userRoleCodes,
          required_roles: requiredRoles,
        },
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user has required permissions
   */
  private checkPermissions(
    user: UserData,
    requiredPermissions: PermissionRequirement[],
  ) {
    const userRoles = user.roles || [];
    const userPermissions = new Set<string>();

    // Unpack ALL role permissions → unique Set (auto de-dups)
    for (const role of userRoles) {
      for (const perm of role.permissions || []) {
        userPermissions.add(perm);
      }
    }

    for (const requirement of requiredPermissions) {
      const ressource = requirement.resource;
      const actions = requirement.actions;

      for (const action of actions) {
        const permString = `${ressource}:${action}`;
        if (!userPermissions.has(permString)) {
          return {
            allowed: false,
            reason: `Missing required permission: ${permString}`,
            metadata: {
              required_permission: permString,
            },
          };
        }
      }
    }
    return { allowed: true };
  }
}
