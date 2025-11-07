import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';
import { EmailModule } from '../common/services/email.module';
import { AuditoriaModule } from '../auditoria/auditoria.module'; // ← AGREGAR ESTA LÍNEA

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Cliente]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    AuditoriaModule, 
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy], // ← Quité EmailModule de aquí (no debe estar en providers)
  exports: [AuthService],
})
export class AuthModule {}