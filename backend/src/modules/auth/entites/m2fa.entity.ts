// auth/entities/m2fa.entity.ts
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { NumericTimestampedEntity } from 'src/database/base.entity';

@Entity('m2fa')
export class M2FA extends NumericTimestampedEntity {
  @Column({ type: 'bigint', unique: true })
  user_id: number;

  // ===== TOTP (Authenticator App) =====
  @Column({ default: false })
  totp_enabled: boolean;

  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  totp_secret: string | null; // Encrypted, permanent secret for TOTP

  @Column({ type: 'timestamp', nullable: true })
  totp_verified_at: Date | null;

  // ===== Email OTP (NOT stored here - use Redis) =====

  @Column({ type: 'timestamp', nullable: true })
  email_otp_last_sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sms_otp_last_sent_at: Date | null;

  // ===== Backup Codes =====
  @Column({ type: 'json', nullable: true, select: false })
  backup_codes: string[] | null; // Hashed backup codes

  @Column({ type: 'int', default: 0 })
  backup_codes_used: number;

  @Column({ type: 'int', default: 0 })
  failed_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  last_failed_attempt_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date | null;

  @OneToOne(() => User, (user) => user.m2fa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
