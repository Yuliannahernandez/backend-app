import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID')
    );
  }


  // ==================== REGISTRO TRADICIONAL (CON VERIFICACIÓN) ====================
  async register(registerDto: RegisterDto) {
    const { correo, password, nombre, apellido, edad, telefono } = registerDto;

    const existingUser = await this.usuarioRepository.findOne({ where: { correo } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token válido por 24 horas

    const usuario = this.usuarioRepository.create({
      correo,
      passwordHash,
      rol: 'cliente',
      estado: 'activo',
      isGoogleAuth: false,
      emailVerified: false, 
      verificationToken, 
      verificationTokenExpiry: tokenExpiry, 
    });

    const savedUsuario = await this.usuarioRepository.save(usuario);

    const cliente = this.clienteRepository.create({
      usuarioId: savedUsuario.id,
      nombre,
      apellido,
      edad,
      telefono,
      idioma: 'es',
      puntosLealtad: 0,
    });

    await this.clienteRepository.save(cliente);

    // Enviar email de verificación
    await this.emailService.sendVerificationEmail(correo, verificationToken, nombre);

    return {
      message: 'Registro exitoso. Por favor verifica tu correo electrónico.',
      requiresVerification: true,
      user: {
        id: savedUsuario.id,
        correo: savedUsuario.correo,
        nombre: cliente.nombre,
        emailVerified: false,
      },
    };
  }

  // ==================== VERIFICAR EMAIL ====================
  async verifyEmail(token: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { verificationToken: token },
      relations: ['cliente'],
    });

    if (!usuario) {
      throw new NotFoundException('Token de verificación inválido');
    }

    if (new Date() > usuario.verificationTokenExpiry) {
      throw new UnauthorizedException('El token de verificación ha expirado');
    }

    if (usuario.emailVerified) {
      throw new BadRequestException('El correo ya ha sido verificado');
    }

    // Marcar como verificado
    usuario.emailVerified = true;
    usuario.verificationToken = null;
    usuario.verificationTokenExpiry = null;
    await this.usuarioRepository.save(usuario);

    // Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail(usuario.correo, usuario.cliente?.nombre || 'Usuario');

    // Generar token JWT para login automático
    const jwtToken = this.generateToken(usuario);

    return {
      message: 'Correo verificado exitosamente',
      token: jwtToken,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.cliente?.nombre,
        apellido: usuario.cliente?.apellido,
        emailVerified: true,
        is2FAEnabled: usuario.is2FAEnabled,
      },
    };
  }

  // ==================== REENVIAR EMAIL DE VERIFICACIÓN ====================
  async resendVerificationEmail(correo: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
      relations: ['cliente'],
    });

    if (!usuario) {
      // No revelar si el usuario existe o no
      return {
        message: 'Si el correo existe, se enviará un nuevo email de verificación',
      };
    }

    if (usuario.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    usuario.verificationToken = verificationToken;
    usuario.verificationTokenExpiry = tokenExpiry;
    await this.usuarioRepository.save(usuario);

    // Enviar email
    await this.emailService.sendVerificationEmail(
      correo,
      verificationToken,
      usuario.cliente?.nombre || 'Usuario'
    );

    return {
      message: 'Email de verificación enviado',
    };
  }

  // ==================== LOGIN TRADICIONAL (CON VERIFICACIÓN) ====================
  async login(loginDto: LoginDto) {
    const { correo, password, twoFACode } = loginDto;

    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
      relations: ['cliente'],
    });

    if (!usuario || usuario.isGoogleAuth) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      throw new UnauthorizedException('Cuenta inactiva o suspendida');
    }

    // ==================== VERIFICAR SI EL EMAIL ESTÁ VERIFICADO ====================
    if (!usuario.emailVerified) {
      return {
        requiresVerification: true,
        message: 'Por favor verifica tu correo electrónico antes de iniciar sesión',
        correo: usuario.correo,
      };
    }

    // Verificar 2FA si está habilitado
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

    usuario.ultimoAcceso = new Date();
    await this.usuarioRepository.save(usuario);

    const token = this.generateToken(usuario);

    return {
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.cliente?.nombre,
        apellido: usuario.cliente?.apellido,
        puntosLealtad: usuario.cliente?.puntosLealtad,
        emailVerified: usuario.emailVerified,
        is2FAEnabled: usuario.is2FAEnabled,
      },
    };
  }
  // ==================== GOOGLE OAUTH ====================
  async googleLogin(googleUser: any) {
    const { googleId, email, firstName, lastName } = googleUser;

    let usuario = await this.usuarioRepository.findOne({
      where: [{ googleId }, { correo: email }],
      relations: ['cliente'],
    });

    if (!usuario) {
      // Crear nuevo usuario con Google
      usuario = this.usuarioRepository.create({
        correo: email,
        googleId,
        rol: 'cliente',
        estado: 'activo',
        isGoogleAuth: true,
        emailVerified: true,
      });

      const savedUsuario = await this.usuarioRepository.save(usuario);

      const cliente = this.clienteRepository.create({
        usuarioId: savedUsuario.id,
        nombre: firstName,
        apellido: lastName,
        idioma: 'es',
        puntosLealtad: 0,
      });

      await this.clienteRepository.save(cliente);
      usuario.cliente = cliente;
    } else {
      // Actualizar información de Google si es necesario
      if (!usuario.googleId) {
        usuario.googleId = googleId;
        usuario.isGoogleAuth = true;
        usuario.emailVerified = true;
        await this.usuarioRepository.save(usuario);
      }

      usuario.ultimoAcceso = new Date();
      await this.usuarioRepository.save(usuario);
    }

    const token = this.generateToken(usuario);

    return {
      message: 'Inicio de sesión con Google exitoso',
      token,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.cliente?.nombre,
        apellido: usuario.cliente?.apellido,
        puntosLealtad: usuario.cliente?.puntosLealtad,
        emailVerified: usuario.emailVerified,
        is2FAEnabled: usuario.is2FAEnabled,
      },
    };
  }

  // ==================== 2FA - GENERAR QR ====================
  async generate2FA(userId: number) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.is2FAEnabled) {
      throw new BadRequestException('2FA ya está habilitado');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('APP_NAME')} (${usuario.correo})`,
      issuer: this.configService.get('APP_NAME'),
    });

    usuario.twoFASecret = secret.base32;
    await this.usuarioRepository.save(usuario);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Escanea este código QR con Google Authenticator',
    };
  }

  // ==================== 2FA - HABILITAR ====================
  async enable2FA(userId: number, token: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.twoFASecret) {
      throw new BadRequestException('Primero debes generar el código QR');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código inválido');
    }

    usuario.is2FAEnabled = true;
    await this.usuarioRepository.save(usuario);

    return {
      message: '2FA habilitado exitosamente',
      is2FAEnabled: true,
    };
  }

  // ==================== 2FA - DESHABILITAR ====================
  async disable2FA(userId: number, token: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.is2FAEnabled) {
      throw new BadRequestException('2FA no está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código inválido');
    }

    usuario.is2FAEnabled = false;
    usuario.twoFASecret = null;
    await this.usuarioRepository.save(usuario);

    return {
      message: '2FA deshabilitado exitosamente',
      is2FAEnabled: false,
    };
  }

  // ==================== VERIFICAR 2FA ====================
  async verify2FA(userId: number, token: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (!usuario || !usuario.is2FAEnabled) {
      throw new BadRequestException('2FA no está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: usuario.twoFASecret,
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

    const usuario = await this.usuarioRepository.findOne({ where: { correo } });
    if (!usuario) {
      return {
        message: 'Si el correo existe, se enviará un enlace de recuperación',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 1);

    usuario.tokenRecuperacion = token;
    usuario.tokenExpiracion = expiracion;
    await this.usuarioRepository.save(usuario);

    console.log(`Token de recuperación para ${correo}: ${token}`);

    return {
      message: 'Si el correo existe, se enviará un enlace de recuperación',
      ...(process.env.NODE_ENV === 'development' && { token }),
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, nuevaPassword } = resetPasswordDto;

    const usuario = await this.usuarioRepository.findOne({
      where: { tokenRecuperacion: token },
    });

    if (!usuario) {
      throw new NotFoundException('Token inválido');
    }

    if (new Date() > usuario.tokenExpiracion) {
      throw new UnauthorizedException('Token expirado');
    }

    usuario.passwordHash = await bcrypt.hash(nuevaPassword, 10);
    usuario.tokenRecuperacion = null;
    usuario.tokenExpiracion = null;
    await this.usuarioRepository.save(usuario);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  // ==================== HELPERS ====================
  private generateToken(usuario: Usuario): string {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(userId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['cliente'],
    });

    if (!usuario || usuario.estado !== 'activo') {
      throw new UnauthorizedException('Usuario no válido');
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.cliente?.nombre,
      apellido: usuario.cliente?.apellido,
      is2FAEnabled: usuario.is2FAEnabled,
    };
  }
    // ==================== VERIFICAR TOKEN DE GOOGLE (NUEVO) ====================
  async verifyGoogleToken(token: string) {
  try {
    console.log(' Token recibido:', token?.substring(0, 50) + '...');
    console.log(' Client ID esperado:', this.configService.get('GOOGLE_CLIENT_ID'));

    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    console.log('Payload de Google:', payload);

    const googleUser = {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || 'Usuario',  
      lastName: payload.family_name || 'Google',  
    };


     console.log('Google User:', googleUser);

    return await this.googleLogin(googleUser);
  } catch (error) {
    console.error(' Error verificando token:', error.message);
    throw new UnauthorizedException('Token de Google inválido: ' + error.message);
  }
}
}