import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  port: configService.getOrThrow<number>('DATABASE_PORT'),
  host: configService.getOrThrow<string>('DATABASE_HOST'),
  username: configService.getOrThrow<string>('DATABASE_USER'),
  password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
  database: configService.getOrThrow<string>('DATABASE_NAME'),
  entities: [
    'src/modules/**/*.entity.ts',
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  extra: {
    connectionLimit: 10,
  },
};

const dataSource = new DataSource(dataSourceOptions);

// You might want to do
// dataSource.initialize()
// but I found mine working regardless of it

export default dataSource;
