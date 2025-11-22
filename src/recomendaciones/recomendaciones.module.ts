
import { Module } from '@nestjs/common';
import { RecomendacionesController } from './recomendaciones.controller';
import { RecomendacionesService } from './recomendaciones.service';

@Module({
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
  exports: [RecomendacionesService]
})
export class RecomendacionesModule {}