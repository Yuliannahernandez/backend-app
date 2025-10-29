import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    // Configuración del transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get('SMTP_PORT') || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      //Ignorar certificados auto-firmados en desarrollo
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verificar conexión al iniciar
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Servidor de email conectado correctamente');
    } catch (error) {
      console.error('Error conectando al servidor de email:', error);
    }
  }

  async sendVerificationEmail(email: string, token: string, nombre: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    console.log(' Enviando email de verificación a:', email);
    console.log(' URL de verificación:', verificationUrl);

    try {
      const info = await this.transporter.sendMail({
        from: `"Reelish" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'Verifica tu correo electrónico - Reelish',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verificación de Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background-color: #7c2d3e; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Bienvenido a Reelish!</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Hola <strong>${nombre}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Gracias por registrarte en Reelish. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" style="margin: 30px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}" 
                                 style="display: inline-block; padding: 16px 40px; background-color: #7c2d3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Verificar mi correo
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; color: #666666;">
                          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                        </p>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #7c2d3e; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; color: #999999;">
                          Este enlace expirará en 24 horas.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          Si no creaste esta cuenta, puedes ignorar este correo.
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                          © ${new Date().getFullYear()} Reelish. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      console.log('Email enviado exitosamente:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Error enviando email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, nombre: string) {
    console.log(' Enviando email de bienvenida a:', email);

    try {
      const info = await this.transporter.sendMail({
        from: `"Reelish" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: '¡Bienvenido a Reelish! ',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Bienvenida</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        <h1 style="color: #7c2d3e; margin: 0 0 20px; font-size: 28px;">¡Bienvenido a Reelish! </h1>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Hola <strong>${nombre}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Tu cuenta ha sido verificada exitosamente. ¡Estamos emocionados de tenerte con nosotros!
                        </p>
                        <p style="margin: 0; font-size: 16px; color: #333333;">
                          Ya puedes comenzar a disfrutar de todos los beneficios de Reelish.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      console.log('Email de bienvenida enviado:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }
 async sendPasswordResetEmail(email: string, token: string, nombre: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    console.log(' Enviando email de recuperación de contraseña a:', email);
    console.log(' URL de recuperación:', resetUrl);

    try {
      const info = await this.transporter.sendMail({
        from: `"Reelish" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'Recuperación de Contraseña - Reelish',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperación de Contraseña</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background-color: #7c2d3e; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Recuperación de Contraseña</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Hola <strong>${nombre || 'Usuario'}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Recibimos una solicitud para restablecer la contraseña de tu cuenta en Reelish.
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                          Haz clic en el botón de abajo para crear una nueva contraseña:
                        </p>
                        
                        <table role="presentation" style="margin: 30px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <a href="${resetUrl}" 
                                 style="display: inline-block; padding: 16px 40px; background-color: #7c2d3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Restablecer Contraseña
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; color: #666666;">
                          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                        </p>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #7c2d3e; word-break: break-all;">
                          ${resetUrl}
                        </p>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; color: #999999;">
                          Este enlace expirará en 1 hora.
                        </p>

                        <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                          <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          Si tienes problemas, contacta a nuestro equipo de soporte.
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                          © ${new Date().getFullYear()} Reelish. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      console.log('Email de recuperación enviado exitosamente:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Error enviando email de recuperación:', error);
      throw error;
    }
  }
}