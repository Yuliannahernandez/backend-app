import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarritoController } from './carrito.controller';
import { CarritoService } from './carrito.service';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { Cliente } from '../entities/cliente.entity';
import { Producto } from '../entities/producto.entity';
import { Sucursal } from '../entities/sucursal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoDetalle, Cliente, Producto, Sucursal]),
  ],
  controllers: [CarritoController],
  providers: [CarritoService],
  exports: [CarritoService],
})
export class CarritoModule {}