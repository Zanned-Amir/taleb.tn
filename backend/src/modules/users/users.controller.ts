import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Paginate } from 'nestjs-paginate';
import { OptionUserAdminDto, OptionUserDto } from './dto/option-user.dto';
import { CreateUserBulkDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SuspendUserDto } from './dto/suspend.dto';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { ACTION, RESSOURCE } from '../auth/types/auth.types';
//TODO: gaurds and permissions implementation
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.read] }])
  @Get()
  async findUsers(@Paginate() query, @Query() dto: OptionUserAdminDto) {
    return await this.usersService.findUsers(query, dto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.create] }])
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.create] }])
  @Post('bulk')
  async createUsersBulk(@Body() createUserBulkDto: CreateUserBulkDto) {
    return await this.usersService.createUsersBulk(createUserBulkDto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.read] }])
  @Get(':id')
  async findUserById(@Query('id') id: number, @Query() dto: OptionUserDto) {
    return await this.usersService.findUserById(id, dto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.update] }])
  @Patch(':id')
  async updateUser(
    @Query('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.delete] }])
  @Delete('soft/:id')
  async softDeleteUser(@Query('id') id: number) {
    return await this.usersService.softDeleteUser(id);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.restore] }])
  @Post('restore/:id')
  async restoreUser(@Query('id') id: number) {
    return await this.usersService.restoreUser(id);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.suspend] }])
  @Post(':id/suspend')
  async suspendUser(
    @Query('id') id: number,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    return await this.usersService.suspendUser(id, suspendUserDto);
  }

  @Permissions([{ resource: RESSOURCE.users, actions: [ACTION.unsuspend] }])
  @Post(':id/unsuspend')
  async unsuspendUser(@Query('id') id: number) {
    return await this.usersService.unsuspendUser(id);
  }
}
