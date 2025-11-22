
import { Module } from '@nestjs/common';
import { TipoCambioController } from './tipo-cambio.controller';
import { TipoCambioService } from './tipo-cambio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [TipoCambioController],
  providers: [TipoCambioService],
  exports: [TipoCambioService]
})
export class TipoCambioModule {}