import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CarritoController } from './carrito.controller';
import { CarritoService } from './carrito.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    HttpModule, // Para comunicarse con Python API
    AuditoriaModule,
  ],
  controllers: [CarritoController],
  providers: [CarritoService],
  exports: [CarritoService],
})
export class CarritoModule {}