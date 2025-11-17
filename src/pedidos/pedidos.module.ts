import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { LealtadModule } from '../lealtad/lealtad.module';

@Module({
  imports: [
    ConfigModule,
    LealtadModule, 
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}