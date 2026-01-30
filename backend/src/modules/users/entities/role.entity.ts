import { NumericTimestampedEntity } from 'src/database/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'roles',
})
export class Role extends NumericTimestampedEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  permissions: string[] | null;
}
