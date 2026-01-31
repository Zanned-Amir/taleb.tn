import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserSettings } from './entities/user-settings.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { OptionUserAdminDto, OptionUserDto } from './dto/option-user.dto';
import { CreateUserBulkDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserMeDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as passwordGenerator from 'generate-password';
import {
  ACCOUNT_STATUS,
  SETTINGS_LANGUAGE,
  SETTINGS_THEME,
} from './types/users.types';
import { usersPaginateConfig } from './pagination/users.pagination';
import { SuspendUserDto } from './dto/suspend.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { ROLE } from '../auth/types/auth.types';
import { SALT_ROUNDS } from '../auth/constant/auth.constant';
import { RegisterDto } from '../auth/dto/register.dto';
import {
  UpdateUserSettingsDto,
  UpdateUserSettingsMeDto,
} from './dto/update-settings.dto';
import { OAuthProfile } from '../oauth/types/oauth-provider.interface';
import { OAuthAccount } from '../oauth/entities/oauth_account.entity';

@Injectable()
export class UsersService {
  private policy;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.policy = {
      minLength: this.configService.get<number>(
        'PASSWORD_MIN_LENGTH',
        8, // default value
      ),
      requireUppercase: this.configService.get<boolean>(
        'PASSWORD_REQUIRE_UPPERCASE',
      ),
      requireLowercase: this.configService.get<boolean>(
        'PASSWORD_REQUIRE_LOWERCASE',
      ),
      requireNumbers: this.configService.get<boolean>(
        'PASSWORD_REQUIRE_NUMBERS',
      ),
      requireSpecialChars: this.configService.get<boolean>(
        'PASSWORD_REQUIRE_SPECIAL_CHARS',
      ),
    };
  }

  async createUser(dto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (!dto.roles?.length) {
      throw new BadRequestException('User must have at least one role');
    }

    const existingRoles = await this.roleRepository.findBy({
      id: In(dto.roles),
    });
    const existingRoleIds = existingRoles.map((role) => role.id);
    const missingRoleIds = dto.roles.filter(
      (id) => !existingRoleIds.includes(id),
    );

    if (missingRoleIds.length > 0) {
      throw new NotFoundException(
        `The following roles do not exist: ${missingRoleIds.join(', ')}`,
      );
    }

    let plain_password: string;
    let hashed_password: string;

    if (dto.auto_generate_password) {
      const generatedPassword = passwordGenerator.generate({
        length: this.policy.minLength || 10,
        numbers: this.policy.requireNumbers || false,
        uppercase: this.policy.requireUppercase || false,
        lowercase: this.policy.requireLowercase || false,
        symbols: this.policy.requireSpecialChars || false,
      });

      hashed_password = await bcrypt.hash(generatedPassword, SALT_ROUNDS);
      plain_password = generatedPassword;
    } else {
      plain_password = dto.password;
      hashed_password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    // TODO: email the plain password to the user if auto generated

    try {
      const manager = queryRunner.manager;

      // Create user
      const user = manager.create(User, {
        email: dto.email,
        full_name: dto.full_name,
        password: hashed_password,
        phone_number: dto.phone_number || null,
        is_verified: dto.is_verified || false,
        is_m2fa_enabled: dto.is_m2fa_enabled || false,
        roles: existingRoles,
      });

      // Save user
      const savedUser = await manager.save(user);

      // Assign roles to user
      await manager
        .createQueryBuilder()
        .relation(User, 'roles')
        .of(savedUser.id)
        .add(dto.roles);

      // Create default user settings
      await manager.save(UserSettings, {
        theme: SETTINGS_THEME.light,
        language: SETTINGS_LANGUAGE.en,
        notifications_enabled: true,
        user_id: savedUser.id,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createUsersBulk(dto: CreateUserBulkDto) {}

  async register(dto: RegisterDto, queryRunner: QueryRunner) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const manager = queryRunner.manager;
    const user = manager.create(User, {
      email: dto.email,
      password: hashedPassword,
      full_name: dto.full_name,
      phone_number: dto.phone_number || null,
    });

    const savedUser = await manager.save(user);

    const role = await this.roleRepository.findOne({
      where: { name: ROLE.user },
    });

    if (!role) {
      throw new InternalServerErrorException(
        `Default user role "${ROLE.user}" not found in database. Please ensure roles are seeded.`,
      );
    }

    await manager
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(savedUser.id)
      .add(role);

    const userSettings = manager.create(UserSettings, {
      user_id: savedUser.id,
      theme: SETTINGS_THEME.light,
      language: SETTINGS_LANGUAGE.en,
      notifications_enabled: false,
    });
    await manager.save(userSettings);

    return savedUser;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.status === ACCOUNT_STATUS.suspended) {
      throw new BadRequestException(
        'Cannot set account status to SUSPENDED via this method , use the suspend user endpoint instead',
      );
    }

    Object.assign(user, dto);

    return await this.userRepository.save(user);
  }

  async softDeleteUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        User,
        { id: id },
        { status: ACCOUNT_STATUS.soft_deleted },
      );

      await queryRunner.manager.softRemove(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restoreUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.restore(User, id);
      await queryRunner.manager.update(
        User,
        { id: id },
        { status: ACCOUNT_STATUS.active },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async suspendUser(id: number, dto: SuspendUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.status = ACCOUNT_STATUS.suspended;
    user.suspended_at = new Date();
    user.suspension_ends_at = dto.suspension_ends_at;
    user.suspension_reason = dto.reason || null;
    await this.userRepository.save(user);
  }

  async unsuspendUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.status = ACCOUNT_STATUS.active;
    user.suspended_at = null;
    user.suspension_ends_at = null;
    user.suspension_reason = null;
    await this.userRepository.save(user);
  }

  async resetUserPassword(id: number, dto: ResetUserPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let hashed_password: string;
    if (dto.auto_generate_password) {
      const generatedPassword = passwordGenerator.generate({
        length: this.policy.minLength || 10,
        numbers: this.policy.requireNumbers || false,
        uppercase: this.policy.requireUppercase || false,
        lowercase: this.policy.requireLowercase || false,
        symbols: this.policy.requireSpecialChars || false,
      });

      hashed_password = await bcrypt.hash(generatedPassword, SALT_ROUNDS);
      user.password = hashed_password;
      await this.userRepository.save(user);
    } else {
      hashed_password = await bcrypt.hash(dto.new_password, SALT_ROUNDS);
    }

    user.password = hashed_password;
    await this.userRepository.save(user);

    // TODO: email the new password to the user if auto generated
  }

  async findUsers(query: PaginateQuery, dto: OptionUserAdminDto) {
    const relations: string[] = [];

    if (dto.include_roles) {
      relations.push('roles');
    }
    if (dto.include_settings) {
      relations.push('settings');
    }

    if (dto.include_oauth_accounts) {
      relations.push('oauth_accounts');
    }
    if (dto.include_sessions) {
      relations.push('sessions');
    }

    if (dto.include_deleted) {
      usersPaginateConfig.withDeleted = true;
    }

    usersPaginateConfig.relations = relations;

    return await paginate<User>(
      query,
      this.userRepository,
      usersPaginateConfig,
    );
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email },
      select: { password: true },
      relations: ['roles'],
    });

    return user;
  }

  async findUserById(id: number, dto: OptionUserAdminDto) {
    const relations: string[] = [];

    if (dto.include_roles) {
      relations.push('roles');
    }

    if (dto.include_settings) {
      relations.push('settings');
    }

    if (dto.include_sessions) {
      relations.push('sessions');
    }

    if (dto.include_oauth_accounts) {
      relations.push('oauth_accounts');
    }

    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: relations,
      withDeleted: dto.include_deleted || false,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async me(user_id: number, dto: OptionUserDto) {
    const relations: string[] = [];

    if (dto.include_roles) {
      relations.push('roles');
    }

    if (dto.include_settings) {
      relations.push('settings');
    }

    if (dto.include_sessions) {
      relations.push('sessions');
    }

    if (dto.include_oauth_accounts) {
      relations.push('oauth_accounts');
    }

    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: relations,
    });
    return user;
  }

  async updateMe(user_id: number, dto: UpdateUserMeDto) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  async softDeleteMe(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        User,
        { id: user_id },
        { status: ACCOUNT_STATUS.soft_deleted },
      );

      await queryRunner.manager.softRemove(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restoreMe(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { id: Number(user_id) },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.restore(User, user_id);
      await queryRunner.manager.update(
        User,
        { id: Number(user_id) },
        { status: ACCOUNT_STATUS.active },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateUserSettingsMe(user_id: number, dto: UpdateUserSettingsMeDto) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['settings'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    Object.assign(user.settings, dto);
    await this.userSettingsRepository.save(user.settings);
  }

  async updateUserSettings(user_id: number, dto: UpdateUserSettingsDto) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['settings'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    Object.assign(user.settings, dto);
    await this.userSettingsRepository.save(user.settings);
  }

  async createOAuthUser(profile: OAuthProfile) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const user = manager.create(User, {
        email: profile.email,
        full_name: profile.first_name + ' ' + profile.last_name,
        is_verified: profile.email_verified || false,
        password: '',
      });

      const savedUser = await manager.save(user);

      const userSettings = manager.create(UserSettings, {
        user_id: savedUser.id,
        theme: SETTINGS_THEME.light,
        language: SETTINGS_LANGUAGE.en,
        notifications_enabled: false,
      });

      const role = await this.roleRepository
        .createQueryBuilder('role')
        .where('role.code = :code', { code: ROLE.user })
        .getOne();

      if (!role) {
        throw new InternalServerErrorException(
          `Default user role "${ROLE.user}" not found in database. Please ensure roles are seeded.`,
        );
      }

      await manager
        .createQueryBuilder()
        .relation(User, 'roles')
        .of(savedUser.id)
        .add(role);

      await manager.save(userSettings);

      const oauthAccount = manager.create(OAuthAccount, {
        user_id: savedUser.id,
        provider: profile.provider,
        provider_account_id: profile.provider_id,
        provider_email: profile.email,
        provider_data: profile.raw_data,
        last_used_at: new Date(),
      });

      await manager.save(oauthAccount);

      savedUser.oauth_accounts = [oauthAccount];

      await manager.save(savedUser);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Failed to create user: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async linkOAuthAccount(user_id: number, profile: OAuthProfile) {
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const oauthAccount = manager.create(OAuthAccount, {
        user_id,
        provider: profile.provider,
        provider_account_id: profile.provider_id,
        provider_email: profile.email,
        provider_data: profile.raw_data,
        last_used_at: new Date(),
      });

      await manager.save(oauthAccount);

      await queryRunner.commitTransaction();
      return oauthAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Failed to link OAuth account: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
