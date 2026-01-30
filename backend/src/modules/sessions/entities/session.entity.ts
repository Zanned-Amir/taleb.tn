// src/auth/entities/session.entity.ts
import { NumericTimestampedEntity } from 'src/database/base.entity';
import { RefreshToken } from 'src/modules/auth/entites/refresh-token.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('sessions')
@Index('idx_user_id', ['user_id'])
export class Session extends NumericTimestampedEntity {
  @Column({ type: 'bigint' })
  @Index()
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_fingerprint: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_activity_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revoke_reason: string | null;

  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_session_user_id',
  })
  user: User;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.session)
  refresh_tokens: RefreshToken[];
}
