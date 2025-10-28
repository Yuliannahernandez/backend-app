import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuponesController } from './cupones.controller';
import { CuponesService } from './cupones.service';
import { Cupon } from '../entities/cupon.entity';
import { CuponUso } from '../entities/cupon-uso.entity';
import { Pedido } from '../entities/pedido.entity';
import { Cliente } from '../entities/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cupon,
      CuponUso,
      Pedido,
      Cliente,
    ]),
  ],
  controllers: [CuponesController],
  providers: [CuponesService],
  exports: [CuponesService],
})
export class CuponesModule {}