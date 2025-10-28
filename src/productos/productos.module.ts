import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { Producto } from '../entities/producto.entity';
import { Categoria } from '../entities/categoria.entity';
import { ProductoImagen } from '../entities/producto-imagen.entity';
import { ProductoIngrediente } from '../entities/producto-ingrediente.entity';
import { Ingrediente } from '../entities/ingrediente.entity';
import { InformacionNutricional } from '../entities/informacion-nutricional.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Categoria,
      ProductoImagen,
      ProductoIngrediente,
      Ingrediente,
      InformacionNutricional,
    ]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}