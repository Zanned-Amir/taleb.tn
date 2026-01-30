import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

import { NumericFullBaseEntity } from 'src/database/base.entity';
import {
  ACTIVITY_LOG_ACTION,
  ActivityLogAction,
  ACTIVITY_LOG_STATUS,
} from '../types/auth.types';

@Entity('activity_logs')
@Index('idx_activity_log_user_id', ['user_id', 'action', 'created_at'])
export class ActivityLog extends NumericFullBaseEntity {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint', nullable: true })
  session_id: number | null;

  @Column({ type: 'enum', enum: ACTIVITY_LOG_ACTION })
  action: string | ActivityLogAction;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  // Change tracking
  @Column({ type: 'json', nullable: true })
  changes: {
    field?: string;
    old_value?: any;
    new_value?: any;
  } | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Status
  @Column({
    default: 'success',
    type: 'enum',
    enum: ACTIVITY_LOG_STATUS,
  })
  status: string | ActivityLog;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, (user) => user.activities, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_activity_log_user_id',
  })
  user: User;
}
