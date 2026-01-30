import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Session } from '../../sessions/entities/session.entity';
import { NumericTimestampedEntity } from 'src/database/base.entity';

@Entity('refresh_tokens')
@Index('idx_refresh_token_user_id', ['user_id'])
export class RefreshToken extends NumericTimestampedEntity {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint', nullable: true })
  session_id: number | null;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @ManyToOne(() => User, (user) => user.refresh_tokens, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_refresh_token_user_id',
  })
  user: User;

  @ManyToOne(() => Session, {
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'fk_refresh_token_session_id',
  })
  session: Session;
}
