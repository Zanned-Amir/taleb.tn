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
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { ACTION, RESSOURCE } from '../auth/types/auth.types';
import { SessionId } from 'src/common/decorator/session-id.decortor';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.read] }])
  @Get()
  async getSessions(@Paginate() query: PaginateQuery) {
    return await this.sessionsService.getSessions(query);
  }

  @Permissions([
    { resource: RESSOURCE.session, actions: [ACTION.read] },
    { resource: RESSOURCE.me, actions: [ACTION.read] },
  ])
  @Get('user/me')
  async getMySessions(
    @CurrentUser() user: User,
    @Paginate() query: PaginateQuery,
  ) {
    return await this.sessionsService.getMySessions(user.id, query);
  }

  @Permissions([
    { resource: RESSOURCE.session, actions: [ACTION.delete] },
    { resource: RESSOURCE.me, actions: [ACTION.delete] },
  ])
  @Delete('user/me')
  async revokeALLMySessions(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
  ) {
    return await this.sessionsService.revokeALLMySessions(user.id, session_id);
  }

  @Permissions([
    { resource: RESSOURCE.session, actions: [ACTION.read] },
    { resource: RESSOURCE.me, actions: [ACTION.read] },
  ])
  @Get('user/me/:id')
  async getMySession(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.sessionsService.getMySession(user.id, id);
  }

  @UseGuards(RevokeSessionGuard)
  @Permissions([
    { resource: RESSOURCE.session, actions: [ACTION.delete] },
    { resource: RESSOURCE.me, actions: [ACTION.delete] },
  ])
  @Delete('user/me/:id')
  async revokeMySession(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.sessionsService.revokeMySession(user.id, id);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.read] }])
  @Get('user/:user_id')
  async getSessionsByUserId(@Param('user_id', ParseIntPipe) user_id: number) {
    return await this.sessionsService.getSessionsByUserId(user_id);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.delete] }])
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

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.delete] }])
  @Delete('user/:user_id')
  async deleteSessionsByUserId(
    @Param('user_id', ParseIntPipe) user_id: number,
  ) {
    return await this.sessionsService.deleteSessionsByUserId(user_id);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.read] }])
  @Get(':id')
  async getSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.getSessionById(id);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.delete] }])
  @UseGuards(RevokeSessionGuard)
  @Post(':id/revoke')
  async revokeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevokeSessionDto,
  ) {
    return await this.sessionsService.revokeSession(id, dto.revoke_reason);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.delete] }])
  @Post(':id/unrevoke')
  async unrevokeSession(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.unrevokeSession(id);
  }

  @Permissions([{ resource: RESSOURCE.session, actions: [ACTION.delete] }])
  @UseGuards(RevokeSessionGuard)
  @Delete(':id')
  async deleteSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionsService.deleteSessionById(id);
  }
}
