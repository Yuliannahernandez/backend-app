import { IsString, IsInt, IsOptional, Min, Max, IsEmail, IsDateString, IsBoolean, IsDecimal, IsArray, IsNumber } from 'class-validator';


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
  fecha_nacimiento?: string;

  @IsOptional()
  @IsInt()
  localidad_id?: number; 

  @IsOptional()
  @IsString()
  idioma?: string;
}

export class CreateDireccionDto {
  @IsString()
  alias: string;

  @IsString()
  direccion_completa: string;  

  @IsString()
  ciudad: string;  

  @IsString()
  provincia: string;

  @IsOptional()
  @IsString()
  codigo_postal?: string;  

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
  es_principal?: boolean;
}

export class CreateMetodoPagoDto {
  @IsString()
  tipo: 'tarjeta_credito' | 'tarjeta_debito' | 'efectivo' | 'transferencia';

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  ultimos_digitos?: string; 

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  nombre_titular?: string;  

  @IsOptional()
  @IsDateString()
  fecha_expiracion?: string;  

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;  

  @IsOptional()
  @IsString()
  token_pago?: string;  
}
export class AddCondicionSaludDto {
  @IsArray()
  @IsNumber({}, { each: true })
  condicion_ids: number[];  
}