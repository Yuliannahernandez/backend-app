

import { Module } from '@nestjs/common';
import { SinpeController } from './sinpe.controller';
import { SinpeService } from './sinpe.service';

@Module({
  controllers: [SinpeController],
  providers: [SinpeService],
  exports: [SinpeService]
})
export class SinpeModule {}