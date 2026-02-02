import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OauthService } from './oauth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { SessionDto } from '../auth/dto/session.dto';

import { User } from '../users/entities/user.entity';

import { type Response } from 'express';

import { type OAuthProfile } from './types/oauth-provider.interface';
import { OAUTH_PROVIDER } from './types/outh.type';
import { Paginate, type PaginateQuery } from 'nestjs-paginate';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { UpdateOAuthDto } from './dto/update-oauth.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { GetSessionData } from 'src/common/decorator/session-data.decorator';
import { GetOAuthProfile } from 'src/common/decorator/oauth-profile.decorator';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { ACTION, RESSOURCE } from '../auth/types/auth.types';
@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}
  // General OAuth Endpoints

  @Permissions([{ resource: RESSOURCE.oauth_account, actions: [ACTION.read] }])
  @Get('accounts')
  async getOAuthAccounts(@Paginate() query: PaginateQuery) {
    return await this.oauthService.getOAuthAccount(query);
  }

  @Permissions([{ resource: RESSOURCE.oauth_account, actions: [ACTION.read] }])
  @Get('accounts/:id')
  async getOAuthAccountById(@Param('id', ParseIntPipe) id: number) {
    return await this.oauthService.getOAuthAccountById(id);
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.delete] },
  ])
  @Post('accounts/:id/delete')
  async deleteOAuthAccount(@Param('id', ParseIntPipe) id: number) {
    return await this.oauthService.deleteOAuthAccount(id);
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
  ])
  @Patch('accounts/:id')
  async updateOAuthAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOAuthDto,
  ) {
    return await this.oauthService.updateOAuthAccount(id, dto);
  }

  // -----    Google OAuth     ----- //

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  async googleLogin() {
    // The guard will handle state creation
    // This method won't actually be called due to Passport redirect
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @CurrentUser() user: User,
    @Query('state') state: string,
    @GetSessionData() sessionData: SessionDto,
    @Res({ passthrough: true })
    res: Response,
    @GetOAuthProfile() oauth_profile: OAuthProfile,
  ) {
    return await this.oauthService.oAuthCallBack(
      user,
      state,
      sessionData,
      res,
      OAUTH_PROVIDER.google,
      oauth_profile,
    );
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Get('google/link')
  async googleLink(@CurrentUser() user: User) {
    return await this.oauthService.linkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.google,
    );
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Post('google/unlink')
  async googleUnlink(@CurrentUser() user: User) {
    return await this.oauthService.unlinkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.google,
    );
  }

  // -----    Facebook OAuth     ----- //

  @Public()
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/login')
  async facebookLogin() {
    // The guard will handle state creation
    // This method won't actually be called due to Passport redirect
  }

  @Public()
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookCallback(
    @CurrentUser() user: User,
    @Query('state') state: string,
    @GetSessionData() sessionData: SessionDto,
    @Res({ passthrough: true }) res: Response,
    @GetOAuthProfile() oauth_profile: OAuthProfile,
  ) {
    return await this.oauthService.oAuthCallBack(
      user,
      state,
      sessionData,
      res,
      OAUTH_PROVIDER.facebook,
      oauth_profile,
    );
  }
  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Get('facebook/link')
  async facebookLink(@CurrentUser() user: User) {
    return await this.oauthService.linkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.facebook,
    );
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Post('facebook/unlink')
  async facebookUnlink(@CurrentUser() user: User) {
    return await this.oauthService.unlinkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.facebook,
    );
  }

  // -----    GitHub OAuth     ----- //
  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github/login')
  async githubLogin() {
    // The guard will handle state creation
    // This method won't actually be called due to Passport redirect
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubCallback(
    @CurrentUser() user: User,
    @Query('state') state: string,
    @GetSessionData() sessionData: SessionDto,
    @Res({ passthrough: true }) res: Response,
    @GetOAuthProfile() oauth_profile: OAuthProfile,
  ) {
    return await this.oauthService.oAuthCallBack(
      user,
      state,
      sessionData,
      res,
      OAUTH_PROVIDER.github,
      oauth_profile,
    );
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Get('github/link')
  async githubLink(@CurrentUser() user: User) {
    return await this.oauthService.linkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.github,
    );
  }

  @Permissions([
    { resource: RESSOURCE.oauth_account, actions: [ACTION.update] },
    {
      resource: RESSOURCE.me,
      actions: [ACTION.update],
    },
  ])
  @Post('github/unlink')
  async githubUnlink(@CurrentUser() user: User) {
    return await this.oauthService.unlinkOAuthAccount(
      user.id,
      OAUTH_PROVIDER.github,
    );
  }
}
