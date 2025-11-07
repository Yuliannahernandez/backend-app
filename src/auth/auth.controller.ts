import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request, 
  Res, 
  Req, 
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuditoriaService } from '../auditoria/auditoria.service'; 
import { AccionAuditoria } from '../entities/auditoria.entity'; 
import { 
  RegisterDto, 
  LoginDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  Enable2FADto, 
  Verify2FADto, 
  GoogleAuthDto, 
  ResendVerificationDto 
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditoriaInterceptor, Auditar } from '../common/interceptors/auditoria.interceptor';

@Controller('auth')
@UseInterceptors(AuditoriaInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaService, 
  ) {}

  
  @Get('test-db')
  async testDatabase() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' TEST DE AUDITORÍA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      console.log(' Servicio:', this.auditoriaService ? 'OK' : 'FALLO');
      
      const resultado = await this.auditoriaService.create({
        usuarioId: 1,
        tabla: 'test_manual',
        accion: AccionAuditoria.SELECT,
        registroId: 999,
        datosNuevos: { test: 'manual', fecha: new Date() },
        ipAddress: '127.0.0.1',
        descripcion: 'Test manual desde controller',
        endpoint: '/auth/test-db',
        metodo: 'GET',
      });

      console.log('Resultado:', resultado);

      if (resultado && resultado.id) {
        console.log('ÉXITO: ID =', resultado.id);
        return {
          success: true,
          mensaje: 'Auditoría guardada',
          id: resultado.id,
        };
      } else {
        console.log(' FALLO: No se guardó');
        return {
          success: false,
          mensaje: 'No se pudo guardar',
        };
      }
    } catch (error) {
      console.error(' ERROR:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
  // ==================== REGISTRO ====================
  @Post('register')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.INSERT,
    descripcion: 'Registro de nuevo usuario' 
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  
  
  // ==================== VERIFICAR EMAIL ====================
  @Get('verify-email')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Verificación de email' 
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // ==================== REENVIAR VERIFICACIÓN ====================
  @Post('resend-verification')
  // No auditar - es solo reenvío de email
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.correo);
  }

  // ==================== LOGIN TRADICIONAL ====================
  @Post('login')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Inicio de sesión' 
  })
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
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Login con Google (callback)' 
  })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Redirigir al frontend con el token
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/google/callback?token=${result.token}`);
  }

  // ==================== GOOGLE LOGIN CON TOKEN (NUEVO) ====================
  @Post('google/login')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Login con Google' 
  })
  async googleLoginWithToken(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.verifyGoogleToken(googleAuthDto.googleToken);
  }

  // ==================== 2FA ====================
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Generación de código 2FA' 
  })
  async generate2FA(@Request() req) {
    return this.authService.generate2FA(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Habilitación de 2FA' 
  })
  async enable2FA(@Request() req, @Body() enableDto: Enable2FADto) {
    return this.authService.enable2FA(req.user.userId, enableDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Deshabilitación de 2FA' 
  })
  async disable2FA(@Request() req, @Body() disableDto: Verify2FADto) {
    return this.authService.disable2FA(req.user.userId, disableDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  // No auditar - solo verificación de código
  async verify2FA(@Request() req, @Body() verifyDto: Verify2FADto) {
    return this.authService.verify2FA(req.user.userId, verifyDto.token);
  }

  // ==================== RECUPERACIÓN DE CONTRASEÑA ====================
  @Post('forgot-password')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Solicitud de recuperación de contraseña' 
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Restablecimiento de contraseña' 
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('find-account')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Búsqueda de cuenta por datos' 
  })
  async findAccount(
    @Body('searchType') searchType: string,
    @Body('searchData') searchData: any,
  ) {
    return this.authService.findAccount(searchType, searchData);
  }

  // ==================== PERFIL Y VERIFICACIÓN ====================
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Auditar({ 
    tabla: 'usuarios', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Consulta de perfil' 
  })
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  // No auditar - solo verificación de token
  async verifyToken(@Request() req) {
    const user = await this.authService.validateUser(req.user.userId);
    return {
      valid: true,
      user,
    };
  }
}