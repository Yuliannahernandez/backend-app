import { Controller, Post, Body, UseGuards, Get, Request, Res, Req,Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, Enable2FADto, Verify2FADto, GoogleAuthDto, ResendVerificationDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  

  // ==================== REGISTRO ====================
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ==================== VERIFICAR EMAIL ====================
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // ==================== REENVIAR VERIFICACIÓN ====================
  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.correo);
  }


  // ==================== LOGIN TRADICIONAL ====================
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ==================== GOOGLE OAUTH (Flujo tradicional) ====================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Inicia el flujo de autenticación con Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Redirigir al frontend con el token
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/google/callback?token=${result.token}`);
  }

  // ==================== GOOGLE LOGIN CON TOKEN (NUEVO) ====================
  @Post('google/login')
  async googleLoginWithToken(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.verifyGoogleToken(googleAuthDto.googleToken);
  }

  // ==================== 2FA ====================
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FA(@Request() req) {
    return this.authService.generate2FA(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2FA(@Request() req, @Body() enableDto: Enable2FADto) {
    return this.authService.enable2FA(req.user.userId, enableDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2FA(@Request() req, @Body() disableDto: Verify2FADto) {
    return this.authService.disable2FA(req.user.userId, disableDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verify2FA(@Request() req, @Body() verifyDto: Verify2FADto) {
    return this.authService.verify2FA(req.user.userId, verifyDto.token);
  }

  // ==================== RECUPERACIÓN DE CONTRASEÑA ====================
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ==================== PERFIL Y VERIFICACIÓN ====================
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyToken(@Request() req) {
    const user = await this.authService.validateUser(req.user.userId);
    return {
      valid: true,
      user,
    };
  }
}