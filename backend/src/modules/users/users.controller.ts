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

//TODO: gaurds and permissions implementation
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findUsers(@Paginate() query, @Query() dto: OptionUserAdminDto) {
    return await this.usersService.findUsers(query, dto);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @Post('bulk')
  async createUsersBulk(@Body() createUserBulkDto: CreateUserBulkDto) {
    return await this.usersService.createUsersBulk(createUserBulkDto);
  }

  @Get(':id')
  async findUserById(@Query('id') id: number, @Query() dto: OptionUserDto) {
    return await this.usersService.findUserById(id, dto);
  }

  @Patch(':id')
  async updateUser(
    @Query('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  @Delete('soft/:id')
  async softDeleteUser(@Query('id') id: number) {
    return await this.usersService.softDeleteUser(id);
  }

  @Post('restore/:id')
  async restoreUser(@Query('id') id: number) {
    return await this.usersService.restoreUser(id);
  }

  @Post(':id/suspend')
  async suspendUser(
    @Query('id') id: number,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    return await this.usersService.suspendUser(id, suspendUserDto);
  }

  @Post(':id/unsuspend')
  async unsuspendUser(@Query('id') id: number) {
    return await this.usersService.unsuspendUser(id);
  }
}
