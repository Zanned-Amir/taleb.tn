import { NumericSoftDeleteEntity } from 'src/database/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserSettings } from './user-settings.entity';
import { Role } from './role.entity';
import { ACCOUNT_STATUS, type AccountStatusType } from '../types/users.types';
import { Session } from 'src/modules/sessions/entities/session.entity';
import { ActivityLog } from 'src/modules/auth/entites/activity-log.entity';
import { RefreshToken } from 'src/modules/auth/entites/refresh-token.entity';
import { M2FA } from 'src/modules/auth/entites/m2fa.entity';
import { Token } from 'src/modules/auth/entites/token.entity';
import { OtpToken } from 'src/modules/auth/entites/otp-token.entity';

@Entity({
  name: 'users',
})
export class User extends NumericSoftDeleteEntity {
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  phone_number: string | null;

  @Column({ type: 'varchar' })
  full_name: string;

  @Column({
    type: 'enum',
    enum: ACCOUNT_STATUS,
    default: ACCOUNT_STATUS.active,
  })
  status: AccountStatusType;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_m2fa_enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'boolean', default: false })
  password_reset_required: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  suspension_ends_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  suspension_reason: string | null;

  @OneToOne(() => UserSettings, (userSettings) => userSettings.user)
  settings: UserSettings;

  @ManyToMany(() => Role, { onDelete: 'SET NULL', nullable: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activities: ActivityLog[];

  @OneToOne(() => M2FA, (m2fa) => m2fa.user)
  m2fa: M2FA | null;

  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @OneToMany(() => OtpToken, (otpToken) => otpToken.user)
  otp_tokens: OtpToken[];
}
