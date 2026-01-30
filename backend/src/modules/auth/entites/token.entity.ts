import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { NumericTimestampedEntity } from 'src/database/base.entity';
import { TOKEN_TYPE, TokenType } from '../types/auth.types';

@Entity({ name: 'tokens' })
export class Token extends NumericTimestampedEntity {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'enum', enum: TOKEN_TYPE })
  type: string | TokenType;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.tokens, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
