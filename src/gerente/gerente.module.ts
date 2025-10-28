import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GerenteController } from './gerente.controller';
import { GerenteService } from './gerente.service';
import { Producto } from '../entities/producto.entity';
import { Categoria } from '../entities/categoria.entity';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { ProductoImagen } from '../entities/producto-imagen.entity';
import { ProductoIngrediente } from '../entities/producto-ingrediente.entity';
import { InformacionNutricional } from '../entities/informacion-nutricional.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Categoria,
      Pedido,
      PedidoDetalle,
      ProductoImagen,
      ProductoIngrediente,
      InformacionNutricional,
    ]),
  ],
  controllers: [GerenteController],
  providers: [GerenteService],
  exports: [GerenteService],
})
export class GerenteModule {}