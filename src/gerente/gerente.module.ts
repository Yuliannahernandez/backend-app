import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GerenteController } from './gerente.controller';
import { GerenteService } from './gerente.service';

@Module({
  imports: [ConfigModule],
  controllers: [GerenteController],
  providers: [GerenteService],
  exports: [GerenteService],
})
export class GerenteModule {}