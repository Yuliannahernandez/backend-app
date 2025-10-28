import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsNumber()
  @IsOptional()
  edad?: number;

  @IsString()
  @IsOptional()
  telefono?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  twoFACode?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;
}

export class ResendVerificationDto {
  @IsEmail()
  correo: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  nuevaPassword: string;
}

export class Enable2FADto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  googleToken: string;
}