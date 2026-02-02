import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Role } from 'src/modules/users/entities/role.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserSettings } from 'src/modules/users/entities/user-settings.entity';
import { SALT_ROUNDS } from 'src/modules/auth/constant/auth.constant';
import {
  SETTINGS_LANGUAGE,
  SETTINGS_THEME,
} from 'src/modules/users/types/users.types';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../../.env') });

interface SeedRole {
  name: string;
  permissions: string[];
}

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  is_verified?: boolean;
  status?: string;
  roles: string[];
}

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Load JSON data files
   */
  private loadJsonFile(filename: string): any[] {
    const filePath = path.join(__dirname, 'data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  /**
   * Seed roles with permissions
   * Updates existing roles, creates new ones if they don't exist
   */
  async seedRoles(): Promise<void> {
    console.log('🌱 Starting role seeding...');
    const roleRepository = this.dataSource.getRepository(Role);
    const rolesData: SeedRole[] = this.loadJsonFile('roles.json');

    for (const roleData of rolesData) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (existingRole) {
        // Update existing role
        existingRole.permissions = roleData.permissions;
        await roleRepository.save(existingRole);
        console.log(`✅ Updated role: ${roleData.name}`);
      } else {
        // Create new role
        const newRole = roleRepository.create({
          name: roleData.name,
          permissions: roleData.permissions,
        });
        await roleRepository.save(newRole);
        console.log(`✨ Created new role: ${roleData.name}`);
      }
    }

    console.log('✓ Role seeding completed\n');
  }

  /**
   * Seed users with their roles
   * Creates new users if they don't exist
   * Skips existing users unless --force flag is passed
   */
  async seedUsers(forceUpdate: boolean = false): Promise<void> {
    console.log('🌱 Starting user seeding...');
    const userRepository = this.dataSource.getRepository(User);
    const roleRepository = this.dataSource.getRepository(Role);
    const userSettingsRepository = this.dataSource.getRepository(UserSettings);
    const usersData: SeedUser[] = this.loadJsonFile('users.json');

    for (const userData of usersData) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
        relations: ['roles'],
      });

      if (existingUser) {
        if (forceUpdate) {
          // Force update: update roles and other fields
          if (userData.roles && userData.roles.length > 0) {
            const roles = await roleRepository.find({
              where: userData.roles.map((roleName) => ({ name: roleName })),
            });
            existingUser.roles = roles;
            await userRepository.save(existingUser);
            console.log(`🔄 Force updated user: ${userData.email}`);
          }
        } else {
          // Skip existing user
          console.log(`⏭️  Skipping existing user: ${userData.email}`);
        }
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(
          userData.password,
          SALT_ROUNDS,
        );

        // Get roles
        const roles = await roleRepository.find({
          where: userData.roles.map((roleName) => ({ name: roleName })),
        });

        if (roles.length === 0) {
          console.warn(
            `⚠️  No roles found for user ${userData.email}. Creating user without roles.`,
          );
        }

        const newUser = userRepository.create({
          email: userData.email,
          password: hashedPassword,
          full_name: userData.full_name,
          phone_number: userData.phone_number || null,
          is_verified: userData.is_verified ?? true,
          status: userData.status || 'active',
          roles: roles.length > 0 ? roles : [],
        });

        const savedUser = await userRepository.save(newUser);

        // Create user settings
        const userSettings = userSettingsRepository.create({
          user_id: savedUser.id,
          theme: SETTINGS_THEME.light,
          language: SETTINGS_LANGUAGE.en,
          notifications_enabled: true,
        });
        await userSettingsRepository.save(userSettings);

        console.log(`✨ Created new user: ${userData.email}`);
      }
    }

    console.log('✓ User seeding completed\n');
  }

  /**
   * Run all seeds
   * @param forceUpdateUsers - If true, updates existing users. Default is false (skip existing)
   */
  async run(forceUpdateUsers: boolean = false): Promise<void> {
    try {
      console.log('\n========================================');
      console.log('   🚀 DATABASE SEEDING STARTED');
      console.log('========================================\n');

      if (forceUpdateUsers) {
        console.log('⚠️  Force update mode: existing users WILL be updated\n');
      }

      await this.seedRoles();
      await this.seedUsers(forceUpdateUsers);

      console.log('========================================');
      console.log('   ✅ DATABASE SEEDING COMPLETED');
      console.log('========================================\n');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Update permissions for a specific role
   */
  async updateRolePermissions(
    roleName: string,
    permissions: string[],
  ): Promise<void> {
    const roleRepository = this.dataSource.getRepository(Role);
    const role = await roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Merge new permissions with existing, avoiding duplicates
    const mergedPermissions = Array.from(
      new Set([...(role.permissions || []), ...permissions]),
    );
    role.permissions = mergedPermissions;
    await roleRepository.save(role);
    console.log(`✅ Updated permissions for role: ${roleName}`);
  }

  /**
   * Assign roles to an existing user
   */
  async assignRolesToUser(
    userEmail: string,
    roleNames: string[],
  ): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const roleRepository = this.dataSource.getRepository(Role);

    const user = await userRepository.findOne({
      where: { email: userEmail },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error(`User '${userEmail}' not found`);
    }

    const roles = await roleRepository.find({
      where: roleNames.map((roleName) => ({ name: roleName })),
    });

    user.roles = roles;
    await userRepository.save(user);
    console.log(`✅ Assigned roles to user: ${userEmail}`);
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userEmail: string, roleName: string): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { email: userEmail },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error(`User '${userEmail}' not found`);
    }

    user.roles = user.roles.filter((role) => role.name !== roleName);
    await userRepository.save(user);
    console.log(`✅ Removed role '${roleName}' from user: ${userEmail}`);
  }

  /**
   * List all seeded roles and their permissions
   */
  async listRoles(): Promise<void> {
    const roleRepository = this.dataSource.getRepository(Role);
    const roles = await roleRepository.find();

    console.log('\n📋 Available Roles:\n');
    for (const role of roles) {
      console.log(`Role: ${role.name}`);
      console.log('Permissions:', JSON.stringify(role.permissions, null, 2));
      console.log('---');
    }
  }

  /**
   * List all seeded users and their roles
   */
  async listUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const users = await userRepository.find({ relations: ['roles'] });

    console.log('\n👥 Seeded Users:\n');
    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.full_name}`);
      console.log(`Roles: ${user.roles.map((r) => r.name).join(', ')}`);
      console.log(`Status: ${user.status}`);
      console.log('---');
    }
  }
}

/**
 * CLI Entry point for seeding
 * Usage: npx ts-node src/database/seed/index.ts
 */
if (require.main === module) {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'taleb_tn',
    entities: ['src/modules/**/*.entity.ts', 'src/modules/**/*.entity.js'],
    migrations: ['src/migrations/*.ts', 'src/migrations/*.js'],
    synchronize: false,
    logging: false,
  });

  AppDataSource.initialize()
    .then(async (dataSource) => {
      const seeder = new DatabaseSeeder(dataSource);
      const command = process.argv[2];
      const forceFlag = process.argv.includes('--force');

      try {
        switch (command) {
          case 'seed':
            await seeder.run(forceFlag);
            break;
          case 'list-roles':
            await seeder.listRoles();
            break;
          case 'list-users':
            await seeder.listUsers();
            break;
          case 'update-role':
            // Example: update-role admin 'users:delete,logs:delete'
            const roleName = process.argv[3];
            const permissionsStr = process.argv[4] || '';
            const permissions = permissionsStr.split(',').map((p) => p.trim());
            await seeder.updateRolePermissions(roleName, permissions);
            break;
          default:
            console.log(`
Usage: npx ts-node src/database/seed/index.ts <command> [options]

Commands:
  seed                              - Run full database seed (roles & users)
                                     Options: --force (force update existing users)
  list-roles                        - List all available roles and permissions
  list-users                        - List all seeded users and their roles
  update-role <name> <permissions>  - Add permissions to a role
                                     Example: npx ts-node src/database/seed/index.ts update-role admin "users:delete,logs:delete"

Examples:
  npm run seed                      - Seed: skip existing users
  npm run seed -- --force           - Seed: force update existing users
            `);
        }
      } finally {
        await dataSource.destroy();
      }
    })
    .catch((error) => {
      console.error('DataSource initialization failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
