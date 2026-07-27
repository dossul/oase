import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthUser } from './auth.service';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Connexion — email + mot de passe' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip ?? 'unknown', req.headers['user-agent'] ?? '');
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vérification code MFA (TOTP, email, ou WhatsApp) — étape 2' })
  verifyMfa(@Body() dto: VerifyMfaDto, @Req() req: Request) {
    return this.authService.verifyMfa(dto.mfa_token, dto.code, req.ip ?? 'unknown', req.headers['user-agent'] ?? '', dto.canal);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotation du refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto.refresh_token, req.ip ?? 'unknown', req.headers['user-agent'] ?? '');
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Révocation du refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @Post('pin/set')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Définir ou modifier le PIN de signature' })
  setPin(@CurrentUser() user: AuthUser, @Body() dto: SetPinDto) {
    return this.authService.setPin(user.id, dto);
  }

  @Post('verify-pin')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier le PIN de signature — répond toujours 200 {valid: true|false}' })
  async verifyPin(@CurrentUser() user: AuthUser, @Body() dto: VerifyPinDto) {
    const valid = await this.authService.verifyPin(user.id, dto.pin);
    return { valid };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Profil enrichi de l'utilisateur connecté (user + contribuable lié + alertes onboarding)",
  })
  me(@CurrentUser() user: AuthUser) {
    return this.profileService.getMeWithContribuable(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mise à jour partielle du profil (nom/prenom librement, telephone via OTP CHANGE_PHONE)",
  })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMeDto,
    @Req() req: Request,
  ) {
    return this.profileService.updateProfile(
      user.id,
      dto,
      req.ip ?? 'unknown',
      req.headers['user-agent'] ?? '',
    );
  }

  @Post('password/change')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changement de mot de passe (avec vérif ancien password)' })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.profileService.changePassword(
      user.id,
      dto,
      req.ip ?? 'unknown',
      req.headers['user-agent'] ?? '',
    );
  }

  @Post('password/reset')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "Reset password (mot de passe oublié) — consomme OTP RESET_PWD + change password + révoque toutes les sessions",
  })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(
      dto,
      req.ip ?? 'unknown',
      req.headers['user-agent'] ?? '',
    );
  }
}
