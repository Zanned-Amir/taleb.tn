import { NumericTimestampedEntity } from 'src/database/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { OTP_TYPE } from '../types/auth.types';

@Entity({ name: 'otp_tokens' })
export class OtpToken extends NumericTimestampedEntity {
  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'enum', enum: OTP_TYPE })
  type: string;

  @Column({ type: 'text', unique: true })
  otp_secret: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.otp_tokens, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
