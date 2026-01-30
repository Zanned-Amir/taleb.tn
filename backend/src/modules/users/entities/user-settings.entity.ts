import { NumericTimestampedEntity } from 'src/database/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import {
  type LanguageType,
  SETTINGS_LANGUAGE,
  SETTINGS_THEME,
  type ThemeType,
} from '../types/users.types';
import { User } from './user.entity';
@Entity({
  name: 'user_settings',
})
export class UserSettings extends NumericTimestampedEntity {
  @Column({ type: 'bigint', unique: true })
  user_id: number;

  @Column({ type: 'varchar', default: SETTINGS_THEME.light })
  theme: ThemeType;

  @Column({ type: 'varchar', default: SETTINGS_LANGUAGE.en })
  language: LanguageType;

  @Column({ type: 'boolean', default: true })
  notifications_enabled: boolean;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' }) //
  @JoinColumn({ name: 'user_id' })
  user: User;
}
