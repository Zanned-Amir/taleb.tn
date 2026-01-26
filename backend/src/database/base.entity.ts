import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

// Base with UUID
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}

// Base with Numeric ID (for entities like UserSettings)
export abstract class NumericBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
}

// Timestamped base - extends UUID BaseEntity
export abstract class TimestampedEntity extends BaseEntity {
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

// Numeric Timestamped base
export abstract class NumericTimestampedEntity extends NumericBaseEntity {
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

// Soft delete base - extends UUID TimestampedEntity
export abstract class SoftDeleteEntity extends TimestampedEntity {
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date | null;
}

// Numeric Soft delete base
export abstract class NumericSoftDeleteEntity extends NumericTimestampedEntity {
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date | null;
}

// Full base with all features - UUID
export abstract class FullBaseEntity extends SoftDeleteEntity {}

// Full base with all features - Numeric
export abstract class NumericFullBaseEntity extends NumericSoftDeleteEntity {}
