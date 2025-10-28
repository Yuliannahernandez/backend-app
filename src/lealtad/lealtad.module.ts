import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LealtadController } from './lealtad.controller';
import { LealtadService } from './lealtad.service';
import { Cliente } from '../entities/cliente.entity';
import { PuntosHistorial } from '../entities/puntos-historial.entity';
import { Recompensa } from '../entities/recompensa.entity';
import { Cupon } from '../entities/cupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      PuntosHistorial,
      Recompensa,
      Cupon,
    ]),
  ],
  controllers: [LealtadController],
  providers: [LealtadService],
  exports: [LealtadService],
})
export class LealtadModule {}