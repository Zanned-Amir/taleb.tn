import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Paginate, type PaginateQuery } from 'nestjs-paginate';
import { RevokeSessionDto } from './dto/revoke-session';
import { User } from '../users/entities/user.entity';
import { RevokeSessionGuard } from './guards/revoke-session.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@Paginate() query: PaginateQuery) {
    return await this.sessionsService.getSessions(query);
  }

  @Get('user/me')
  async getMySessions(
    @CurrentUser() user: User,
    @Paginate() query: PaginateQuery,
  ) {
    return await this.sessionsService.getMySessions(user.id, query);
  }

  @Get('user/me/:id')
  async getMySession(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.sessionsService.getMySession(user.id, id);
  }

  @UseGuards(RevokeSessionGuard)
  @Delete('user/me/:id')
  async revokeMySession(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.sessionsService.revokeMySession(user.id, id);
  }

  @Get('user/:user_id')
  async getSessionsByUserId(@Param('user_id', ParseIntPipe) user_id: number) {
    return await this.sessionsService.getSessionsByUserId(user_id);
  }

  @Post('user/:user_id/revoke')
  async revokeSessionsByUserId(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: RevokeSessionDto,
  ) {
    return await this.sessionsService.revokeSessionsByUserId(
      user_id,
      dto.revoke_reason,
    );
  }

  @Delete('user/:user_id')
  async deleteSessionsByUserId(
    @Param('user_id', ParseIntPipe) user_id: number,
  ) {
    return await this.sessionsService.deleteSessionsByUserId(user_id);
  }

  @Get(':id')
  async getSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.getSessionById(id);
  }

  @UseGuards(RevokeSessionGuard)
  @Post(':id/revoke')
  async revokeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevokeSessionDto,
  ) {
    return await this.sessionsService.revokeSession(id, dto.revoke_reason);
  }

  @Post(':id/unrevoke')
  async unrevokeSession(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.unrevokeSession(id);
  }

  @UseGuards(RevokeSessionGuard)
  @Delete(':id')
  async deleteSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.deleteSessionById(id);
  }
}
