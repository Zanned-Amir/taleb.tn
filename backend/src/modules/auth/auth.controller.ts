import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { GetSessionData } from 'src/common/decorator/session-data.decorator';
import { SessionId } from 'src/common/decorator/session-id.decortor';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { SessionDto } from './dto/session.dto';
import { type Response } from 'express';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserMeDto } from '../users/dto/update-user.dto';
import { OptionUserDto } from '../users/dto/option-user.dto';
import {
  ConfirmEmailDto,
  ConfirmEmailOTPDto,
  EmailConfirmationDto,
} from './dto/email-confirmation.dto';
import { IpAddress } from 'src/common/decorator/ip-address.decorator';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import {
  ResetPasswordV1Dto,
  ResetPasswordV2Dto,
} from './dto/reset-password.dto';
import {
  DisableM2FADto,
  M2FADto,
  SetM2FAAuthenticationMethodDto,
  VerifyM2FAOtpDto,
} from './dto/verify-m2fa-otp.dto';
import { SkipM2FA } from './dto/account.decorator';
import { M2FAAlreadyVerifiedGuard } from './guards/m2fa-already-verified.guard';
import { VerifyM2FATotpDto } from './dto/verify-m2fa_totp.dto';
import { SendChangeEmailDto } from './dto/send-change-email.dto';
import { ConfirmChangeEmailDto } from './dto/change-email.dto';
import { UpdateUserSettingsMeDto } from '../users/dto/update-settings.dto';
import { changePasswordDto } from './dto/change-password.dto';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { ACTION, RESSOURCE } from './types/auth.types';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Header versions with 'h/' prefix, e.g., 'h/login', 'h/register'
  @Public()
  @Post('h/register')
  async register(
    @Body() dto: RegisterDto,
    @GetSessionData() sessionData: SessionDto,
  ) {
    return await this.authService.register(dto, sessionData);
  }

  @Public()
  @Post('h/login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @GetSessionData() sessionData: SessionDto,
  ) {
    return await this.authService.login(user, sessionData);
  }

  @Public()
  @Post('h/refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
  ) {
    return await this.authService.refreshToken(user, session_id);
  }

  @Post('h/logout')
  async logout(@CurrentUser() user: User, @SessionId() session_id: number) {
    return await this.authService.logout(user, session_id);
  }

  @Post('h/logout-all')
  async logoutAll(@CurrentUser() user: User) {
    return await this.authService.logoutAllSessions(user);
  }

  // cookie versions with 'c/' prefix, e.g., 'c/login', 'c/register'

  @Public()
  @Post('c/register')
  async registerCookie(
    @Body() dto: RegisterDto,
    @GetSessionData() sessionData: SessionDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return await this.authService.registerWithCookies(dto, sessionData, res);
  }

  @Public()
  @Post('c/login')
  @UseGuards(LocalAuthGuard)
  async loginCookie(
    @CurrentUser() user: User,
    @GetSessionData() sessionData: SessionDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return await this.authService.loginWithCookies(user, sessionData, res);
  }

  @Public()
  @Post('c/refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshTokenCookie(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return await this.authService.refreshTokenWithCookies(
      user,
      session_id,
      res,
    );
  }

  @Post('c/logout')
  async logoutCookie(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return await this.authService.logoutWithCookies(user, session_id, res);
  }

  @Post('c/logout-all')
  async logoutAllCookie(
    @CurrentUser() user: User,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return await this.authService.logoutAllSessionsWithCookies(user, res);
  }

  // Change Password endpoint

  @Permissions([
    { resource: RESSOURCE.auth_settings, actions: [ACTION.update] },
  ])
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: changePasswordDto,
  ) {
    return await this.authService.changePassword(
      user.id,
      dto.current_password,
      dto.new_password,
      dto.logout_all,
    );
  }
  // Email confirmation endpoints by link
  @Public()
  @Post('send-verify-email/link')
  async sendConfirmationEmail(@Body() dto: EmailConfirmationDto) {
    return await this.authService.sendVerificationEmailByLink(dto.email);
  }

  // Confirm Email endpoint by link

  @Public()
  @Post('confirm-email/link')
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return await this.authService.confirmEmailByLink(dto.token);
  }

  @Public()
  @Post('send-verify-email/otp')
  async sendConfirmationEmailOtp(@Body() dto: EmailConfirmationDto) {
    return await this.authService.sendVerificationEmailByOtp(dto.email);
  }

  // Confirm Email endpoint by OTP
  @Public()
  @Post('confirm-email/otp')
  async confirmEmailOtp(@Body() dto: ConfirmEmailOTPDto) {
    return await this.authService.confirmEmailByOtp(dto.token, dto.otp_code);
  }

  // Forget Password endpoints  magic link (v1)

  @Public()
  @Post('forget-password/link')
  async forgetPasswordByLink(
    @Body() dto: ForgetPasswordDto,
    @IpAddress() requestIp: string,
  ) {
    return await this.authService.forgetPasswordByLink(dto.email, requestIp);
  }

  // Forget Password endpoints  OTP (v2)
  @Public()
  @Post('forget-password/otp')
  async forgetPasswordByOtp(
    @Body() dto: ForgetPasswordDto,
    @IpAddress() requestIp: string,
  ) {
    return await this.authService.forgetPasswordByOtp(dto.email, requestIp);
  }

  // Reset Password endpoints  (v1)  magic link
  @Public()
  @Post('reset-password/link')
  async resetPasswordByLink(@Body() dto: ResetPasswordV1Dto) {
    return await this.authService.resetPasswordByLink(
      dto.token,
      dto.new_password,
    );
  }

  // Reset Password endpoints  (v2)  OTP

  @Public()
  @Post('reset-password/otp')
  async resetPasswordByOtp(@Body() dto: ResetPasswordV2Dto) {
    return await this.authService.resetPasswordByOtp(
      dto.token,
      dto.otp_code,
      dto.new_password,
    );
  }

  // m2fa  endpoints

  // Set m2fa authentication method endpoint
  @Permissions([{ resource: RESSOURCE.m2fa, actions: [ACTION.update] }])
  @Post('m2fa/setup-m2fa')
  async setupM2FA(
    @CurrentUser() user: User,
    @Body() dto: SetM2FAAuthenticationMethodDto,
  ) {
    return await this.authService.setAuthenticationMethod(
      user.id,
      dto.method,
      dto.password,
    );
  }

  // Send m2fa otp endpoint
  @SkipM2FA()
  @UseGuards(M2FAAlreadyVerifiedGuard)
  @Post('m2fa/send-m2fa-otp')
  async sendM2FAOtp(@CurrentUser() user: User, @IpAddress() requestIp: string) {
    return await this.authService.sendM2FAOtp(user.id, requestIp);
  }

  // Verify m2fa totp authenticator endpoint
  @SkipM2FA()
  @UseGuards(M2FAAlreadyVerifiedGuard)
  @Post('m2fa/verify-m2fa-authenticator')
  async verifyM2FATotpAuthenticator(
    @CurrentUser() user: User,
    @Body() dto: VerifyM2FATotpDto,
    @Res({ passthrough: true }) res: Response,
    @SessionId() session_id: number,
  ) {
    return await this.authService.verifyM2FAAuthenticator(
      user.id,
      dto.otp_code,
      session_id,
      res,
      dto.auth_type,
    );
  }

  // Verify m2fa otp endpoint
  @SkipM2FA()
  @UseGuards(M2FAAlreadyVerifiedGuard)
  @Post('m2fa/verify-m2fa-otp')
  async verifyM2FAOtp(
    @CurrentUser() user: User,
    @Body() dto: VerifyM2FAOtpDto,
    @Res({ passthrough: true }) res: Response,
    @SessionId() session_id: number,
  ) {
    return await this.authService.verifyM2FAOtp(
      user.id,
      dto.otp_code,
      dto.token,
      session_id,
      res,
      dto.auth_type,
    );
  }

  // Disable m2fa endpoint
  @Permissions([{ resource: RESSOURCE.m2fa, actions: [ACTION.update] }])
  @Post('m2fa/enable-m2fa')
  async enableM2FA(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: M2FADto,
  ) {
    return await this.authService.enableM2FA(
      user.id,
      session_id,
      res,
      dto.auth_type,
    );
  }

  // Disable m2fa
  @Permissions([{ resource: RESSOURCE.m2fa, actions: [ACTION.update] }])
  @Post('m2fa/disable-m2fa')
  async disableM2FA(
    @CurrentUser() user: User,
    @SessionId() session_id: number,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: DisableM2FADto,
  ) {
    return await this.authService.disableM2FA(
      user.id,
      session_id,
      res,
      dto.auth_type,
      dto.password,
    );
  }

  @Permissions([{ resource: RESSOURCE.me, actions: [ACTION.read] }])
  @Get('me')
  async me(@CurrentUser() user: User, @Query() include: OptionUserDto) {
    return await this.authService.me(user.id, include);
  }

  @Permissions([{ resource: RESSOURCE.me, actions: [ACTION.update] }])
  @Patch('me')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserMeDto) {
    return await this.authService.updateMe(user.id, dto);
  }

  // Change Email endpoints
  @Permissions([
    { resource: RESSOURCE.auth_settings, actions: [ACTION.update] },
  ])
  @Post('me/send-change-email')
  async sendChangeEmail(
    @CurrentUser() user: User,
    @Body() dto: SendChangeEmailDto,
  ) {
    return await this.authService.sendChnageEmailRequest(
      user.id,
      dto.new_email,
      dto.password,
    );
  }

  // Confirm Change Email endpoint
  @Permissions([
    { resource: RESSOURCE.auth_settings, actions: [ACTION.update] },
  ])
  @Post('me/confirm-change-email')
  async confirmChangeEmail(@Body() dto: ConfirmChangeEmailDto) {
    return await this.authService.changeEmail(dto.token);
  }

  // delete account ( soft delete after 14 days  it will be permanently deleted )
  @Permissions([{ resource: RESSOURCE.me, actions: [ACTION.delete] }])
  @Delete('me/delete-account')
  async deleteAccount(@CurrentUser() user: User) {
    return await this.authService.SoftDeleteMe(user.id);
  }

  // restore soft deleted account
  @Permissions([{ resource: RESSOURCE.me, actions: [ACTION.restore] }])
  @Post('me/restore-account')
  async restoreAccount(@CurrentUser() user: User) {
    return await this.authService.restoreMe(user.id);
  }

  // update user settings
  @Permissions([{ resource: RESSOURCE.me, actions: [ACTION.update] }])
  @Patch('me/settings')
  async updateMySettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserSettingsMeDto,
  ) {
    return await this.authService.updateMySettings(user.id, dto);
  }
}
