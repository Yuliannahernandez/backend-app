import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { Cliente } from '../entities/cliente.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { LealtadModule } from '../lealtad/lealtad.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      PedidoDetalle,
      Cliente,
      Sucursal,
    ]),
    LealtadModule, 
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}