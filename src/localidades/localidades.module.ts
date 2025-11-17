
import { Module } from '@nestjs/common';
import { LocalidadesController } from './localidades.controller';
import { LocalidadesService } from './localidades.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [LocalidadesController],
  providers: [LocalidadesService],
  exports: [LocalidadesService]
})
export class LocalidadesModule {}