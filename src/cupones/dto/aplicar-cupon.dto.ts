import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class AplicarCuponDto {
  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código de cupón es requerido' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  codigo: string;
}