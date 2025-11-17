import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CuponesController } from './cupones.controller';
import { CuponesService } from './cupones.service';

@Module({
  imports: [ConfigModule],
  controllers: [CuponesController],
  providers: [CuponesService],
  exports: [CuponesService],
})
export class CuponesModule {}