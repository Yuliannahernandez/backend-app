import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SucursalesController } from './sucursales.controller';
import { SucursalesService } from './sucursales.service';

@Module({
  imports: [ConfigModule ,HttpModule,],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  
  exports: [SucursalesService],
})
export class SucursalesModule {}