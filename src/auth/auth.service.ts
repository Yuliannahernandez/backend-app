import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from '../common/services/email.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AccionAuditoria } from '../entities/auditoria.entity';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private apiClient: AxiosInstance;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private auditoriaService: AuditoriaService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID')
    );

    this.apiClient = axios.create({
      baseURL: this.configService.get('PYTHON_API_URL') || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============= HELPER: Convertir fecha a formato MySQL =============
  private toMySQLDateTime(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  // ==================== REGISTRO TRADICIONAL ====================
  async register(registerDto: RegisterDto) {
    const { correo, password, nombre, apellido, edad, telefono } = registerDto;

    try {
      const existingUser = await this.apiClient.get(`/usuarios/email/${correo}`)
        .catch(() => null);

      if (existingUser?.data) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }

    const password_Hash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // ✅ Convertir fecha a formato MySQL
    const usuarioData = {
      correo,
      password_Hash,
      nombre,
      apellido,
      edad,
      telefono,
      rol: 'cliente',
      verificationToken: verificationToken,
      verificationTokenExpiry: this.toMySQLDateTime(tokenExpiry),
    };

    const response = await this.apiClient.post('/usuarios', usuarioData);
    const savedUsuario = response.data;

    await this.emailService.sendVerificationEmail(correo, verificationToken, nombre);

    return {
      message: 'Registro exitoso. Por favor verifica tu correo electrónico.',
      requiresVerification: true,
      user: {
        id: savedUsuario.id,
        correo: savedUsuario.correo,
        nombre: savedUsuario.nombre,
        emailVerified: false,
      },
    };
  }

  // ==================== LOGIN TRADICIONAL ====================
  async login(loginDto: LoginDto) {
    const { correo, password, twoFACode } = loginDto;

    try {
      const response = await this.apiClient.get(`/usuarios/email/${correo}`);
      const usuario = response.data;

      if (!usuario) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const passwordHash = usuario.passwordHash || usuario.password_hash || usuario.password;

      if (!passwordHash) {
        console.error('❌ No se encontró campo de contraseña en el usuario:', usuario);
        throw new UnauthorizedException('Error interno: usuario sin hash de contraseña');
      }

      const isPasswordValid = await bcrypt.compare(password, passwordHash);

      if (!isPasswordValid) {
        try {
          await this.auditoriaService.create({
            usuarioId: 0,
            tabla: 'usuarios',
            accion: AccionAuditoria.SELECT,
            registroId: 0,
            datosNuevos: { correo, resultado: 'Credenciales inválidas' },
            ipAddress: undefined,
            descripcion: `Intento de login fallido: ${correo}`,
            endpoint: '/auth/login',
            metodo: 'POST',
          });
        } catch (error) {
          console.error('Error auditando intento fallido:', error);
        }
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (usuario.estado !== 'activo') {
        throw new UnauthorizedException('Cuenta inactiva o suspendida');
      }

      if (!usuario.emailVerified) {
        return {
          requiresVerification: true,
          message: 'Por favor verifica tu correo electrónico antes de iniciar sesión',
          correo: usuario.correo,
        };
      }

      if (usuario.is2FAEnabled) {
        if (!twoFACode) {
          return {
            requires2FA: true,
            message: 'Se requiere código 2FA',
          };
        }

        const isValid = speakeasy.totp.verify({
          secret: usuario.twoFASecret,
          encoding: 'base32',
          token: twoFACode,
          window: 2,
        });

        if (!isValid) {
          throw new UnauthorizedException('Código 2FA inválido');
        }
      }

      // ✅ Actualizar último acceso con formato MySQL
      try {
        await this.apiClient.put(`/usuarios/${usuario.id}/ultimo-acceso`, {});
      } catch (error) {
        console.error('Error actualizando último acceso:', error);
      }

      try {
        await this.auditoriaService.logSelect(
          usuario.id,
          'usuarios',
          undefined,
          '/auth/login',
          `Login exitoso: ${correo}`,
        );
      } catch (error) {
        console.error('Error auditando login:', error);
      }

      const token = this.generateToken(usuario);

      return {
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: usuario.id,
          correo: usuario.correo,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          puntosLealtad: usuario.puntosLealtad || usuario.puntos_lealtad,
          emailVerified: usuario.emailVerified,
          is2FAEnabled: usuario.is2FAEnabled || usuario.is_2fa_enabled,
        },
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      throw error;
    }
  }

  // ==================== GOOGLE OAUTH ====================
  async googleLogin(googleUser: any) {
    const { googleId, email, firstName, lastName } = googleUser;

    try {
      const response = await this.apiClient.get(`/usuarios/email/${email}`)
        .catch(() => null);

      let usuario = response?.data;

      if (!usuario) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

        const nuevoUsuario = {
          correo: email,
          password_Hash: passwordHash,
          nombre: firstName,
          apellido: lastName,
          rol: 'cliente',
        };

        const createResponse = await this.apiClient.post('/usuarios', nuevoUsuario);
        usuario = createResponse.data;
      }

      const token = this.generateToken(usuario);

      return {
        message: 'Inicio de sesión con Google exitoso',
        token,
        user: {
          id: usuario.id,
          correo: usuario.correo,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          puntosLealtad: usuario.puntosLealtad || usuario.puntos_lealtad,
          emailVerified: true,
          is2FAEnabled: usuario.is2FAEnabled || false,
        },
      };
    } catch (error) {
      console.error('Error en googleLogin:', error);
      throw new UnauthorizedException('Error al iniciar sesión con Google');
    }
  }

  // ==================== 2FA - GENERAR QR ====================
  async generate2FA(userId: number) {
    try {
      const response = await this.apiClient.get(`/usuarios/${userId}`);
      const usuario = response.data;

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (usuario.is2FAEnabled || usuario.is_2fa_enabled) {
        throw new BadRequestException('2FA ya está habilitado');
      }

      const secret = speakeasy.generateSecret({
        name: `${this.configService.get('APP_NAME')} (${usuario.correo})`,
        issuer: this.configService.get('APP_NAME'),
      });

      await this.apiClient.put(`/usuarios/${userId}`, {
        two_fa_secret: secret.base32,
      });

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        message: 'Escanea este código QR con Google Authenticator',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }

  // ==================== 2FA - HABILITAR ====================
  async enable2FA(userId: number, token: string) {
    const response = await this.apiClient.get(`/usuarios/${userId}`);
    const usuario = response.data;

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.twoFASecret && !usuario.two_fa_secret) {
      throw new BadRequestException('Primero debes generar el código QR');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret || usuario.two_fa_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.apiClient.put(`/usuarios/${userId}`, {
      is_2fa_enabled: true,
    });

    return {
      message: '2FA habilitado exitosamente',
      is2FAEnabled: true,
    };
  }

  // ==================== 2FA - DESHABILITAR ====================
  async disable2FA(userId: number, token: string) {
    const response = await this.apiClient.get(`/usuarios/${userId}`);
    const usuario = response.data;

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.is2FAEnabled && !usuario.is_2fa_enabled) {
      throw new BadRequestException('2FA no está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret || usuario.two_fa_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.apiClient.put(`/usuarios/${userId}`, {
      is_2fa_enabled: false,
      two_fa_secret: null,
    });

    return {
      message: '2FA deshabilitado exitosamente',
      is2FAEnabled: false,
    };
  }

  // ==================== VERIFICAR 2FA ====================
  async verify2FA(userId: number, token: string) {
    const response = await this.apiClient.get(`/usuarios/${userId}`);
    const usuario = response.data;

    if (!usuario || (!usuario.is2FAEnabled && !usuario.is_2fa_enabled)) {
      throw new BadRequestException('2FA no está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret || usuario.two_fa_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return {
      valid: isValid,
      message: isValid ? 'Código válido' : 'Código inválido',
    };
  }

  // ==================== RECUPERAR CONTRASEÑA ====================
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { correo } = forgotPasswordDto;

    try {
      const response = await this.apiClient.get(`/usuarios/email/${correo}`);
      const usuario = response.data;

      if (!usuario) {
        return {
          message: 'Si el correo existe, se enviará un enlace de recuperación',
        };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + 1);

      // ✅ Convertir fecha a formato MySQL
      await this.apiClient.put(`/usuarios/${usuario.id}`, {
        token_recuperacion: token,
        token_expiracion: this.toMySQLDateTime(expiracion),
      });

      await this.emailService.sendPasswordResetEmail(
        correo,
        token,
        usuario.nombre || 'Usuario'
      );

      return {
        message: 'Si el correo existe, se enviará un enlace de recuperación',
        ...(process.env.NODE_ENV === 'development' && {
          token,
          resetUrl: `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`,
        }),
      };
    } catch (error) {
      return {
        message: 'Si el correo existe, se enviará un enlace de recuperación',
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, nuevaPassword } = resetPasswordDto;

    try {
      const response = await this.apiClient.get(`/usuarios/recovery-token/${token}`);
      const usuario = response.data;

      if (!usuario) {
        throw new NotFoundException('Token inválido');
      }

      const passwordHash = await bcrypt.hash(nuevaPassword, 10);

      await this.apiClient.put(`/usuarios/${usuario.id}`, {
        password_hash: passwordHash,
        token_recuperacion: null,
        token_expiracion: null,
      });

      return {
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Token inválido');
      }
      throw error;
    }
  }

  // ==================== HELPERS ====================
  private generateToken(usuario: any): string {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(userId: number) {
    try {
      const response = await this.apiClient.get(`/usuarios/${userId}`);
      const usuario = response.data;

      if (!usuario || usuario.estado !== 'activo') {
        throw new UnauthorizedException('Usuario no válido');
      }

      return {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        is2FAEnabled: usuario.is2FAEnabled || usuario.is_2fa_enabled,
      };
    } catch (error) {
      throw new UnauthorizedException('Usuario no válido');
    }
  }

  // ==================== VERIFICAR TOKEN DE GOOGLE ====================
  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      const googleUser = {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name || 'Usuario',
        lastName: payload.family_name || 'Google',
      };

      return await this.googleLogin(googleUser);
    } catch (error) {
      throw new UnauthorizedException('Token de Google inválido: ' + error.message);
    }
  }

  // ==================== VERIFICAR EMAIL ====================
  async verifyEmail(token: string) {
    try {
      const response = await this.apiClient.get(`/usuarios/verification-token/${token}`);
      const usuario = response.data;

      if (!usuario) {
        throw new NotFoundException('Token de verificación inválido');
      }

      if (usuario.emailVerified) {
        throw new BadRequestException('El correo ya ha sido verificado');
      }

      await this.apiClient.put(`/usuarios/${usuario.id}`, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      await this.emailService.sendWelcomeEmail(usuario.correo, usuario.nombre || 'Usuario');

      const jwtToken = this.generateToken(usuario);

      return {
        message: 'Correo verificado exitosamente',
        token: jwtToken,
        user: {
          id: usuario.id,
          correo: usuario.correo,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          emailVerified: true,
          is2FAEnabled: usuario.is2FAEnabled || usuario.is_2fa_enabled,
        },
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Token de verificación inválido');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail);
      }
      throw error;
    }
  }

  // ==================== REENVIAR VERIFICACIÓN ====================
  async resendVerificationEmail(correo: string) {
    try {
      const response = await this.apiClient.get(`/usuarios/email/${correo}`);
      const usuario = response.data;

      if (!usuario) {
        return {
          message: 'Si el correo existe, se enviará un nuevo email de verificación',
        };
      }

      if (usuario.emailVerified) {
        throw new BadRequestException('El correo ya está verificado');
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      // ✅ Convertir fecha a formato MySQL
      await this.apiClient.put(`/usuarios/${usuario.id}`, {
        verificationToken,
        verificationTokenExpiry: this.toMySQLDateTime(tokenExpiry),
      });

      await this.emailService.sendVerificationEmail(
        correo,
        verificationToken,
        usuario.nombre || 'Usuario'
      );

      return {
        message: 'Email de verificación enviado',
      };
    } catch (error) {
      return {
        message: 'Si el correo existe, se enviará un nuevo email de verificación',
      };
    }
  }

  // ==================== BUSCAR CUENTA ====================
  async findAccount(searchType: string, searchData: any) {
    try {
      let response;

      if (searchType === 'phone') {
        response = await this.apiClient.get(`/usuarios/by-phone/${searchData.telefono}`);
      } else if (searchType === 'name') {
        response = await this.apiClient.get(`/usuarios/by-name`, {
          params: {
            nombre: searchData.nombre,
            apellido: searchData.apellido,
          },
        });
      }

      const usuario = response?.data;

      if (!usuario) {
        return {
          found: false,
          message: 'No se encontró ninguna cuenta con esa información',
        };
      }

      const correoOculto = this.maskEmail(usuario.correo);

      return {
        found: true,
        correo: correoOculto,
        fullEmail: usuario.correo,
        message: 'Cuenta encontrada',
      };
    } catch (error) {
      return {
        found: false,
        message: 'No se encontró ninguna cuenta con esa información',
      };
    }
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    const maskedLocal =
      localPart.substring(0, visibleChars) +
      '*'.repeat(localPart.length - visibleChars);
    return `${maskedLocal}@${domain}`;
  }
}