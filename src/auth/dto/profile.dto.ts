import { IsString, IsInt, IsOptional, Min, Max, IsEmail, IsDateString, IsBoolean, IsDecimal, IsArray, IsNumber } from 'class-validator';

// DTO para actualizar perfil del cliente
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  edad?: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  idioma?: string;
}

// DTO para crear/actualizar dirección
export class CreateDireccionDto {
  @IsOptional()
  @IsString()
  alias?: string;

  @IsString()
  direccionCompleta: string;

  @IsString()
  ciudad: string;

  @IsString()
  provincia: string;

  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

// DTO para crear/actualizar método de pago
export class CreateMetodoPagoDto {
  @IsString()
  tipo: 'tarjeta_credito' | 'tarjeta_debito' | 'efectivo' | 'transferencia';

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  ultimosDigitos?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  nombreTitular?: string;

  @IsOptional()
  @IsDateString()
  fechaExpiracion?: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @IsOptional()
  @IsString()
  tokenPago?: string;
}

// DTO para agregar condición de salud
export class AddCondicionSaludDto {
  @IsArray()
  @IsNumber({}, { each: true })
  condicionIds: number[];
}