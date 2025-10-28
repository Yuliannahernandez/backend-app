// carrito/dto/agregar-producto.dto.ts
import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AgregarProductoDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  productoId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cantidad: number;
}