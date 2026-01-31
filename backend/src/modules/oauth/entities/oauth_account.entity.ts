import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OAUTH_PROVIDER } from '../types/outh.type';
import { NumericTimestampedEntity } from 'src/database/base.entity';

@Entity('oauth_accounts')
@Index('idx_oauth_provider_account', ['provider', 'provider_account_id'], {
  unique: true,
})
@Unique('uq_oauth_per_user_provider', ['user_id', 'provider'])
@Index('idx_oauth_user_id', ['user_id'])
export class OAuthAccount extends NumericTimestampedEntity {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ enum: OAUTH_PROVIDER, type: 'enum', nullable: false })
  provider: OAUTH_PROVIDER;

  @Column()
  provider_account_id: string;

  @Column({ nullable: true })
  provider_email: string;

  @Column({ type: 'json', nullable: true })
  provider_data: {
    name?: string;
    picture?: string;
    profile_url?: string;
    verified_email?: boolean;
    [key: string]: any;
  } | null; // Store additional provider-specific data

  @Column({ nullable: true, type: 'timestamp' })
  last_used_at: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, (user) => user.oauth_accounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_user_oauth_accounts_user_id',
  })
  user: User;
}
