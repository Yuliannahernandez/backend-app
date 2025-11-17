import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LealtadController } from './lealtad.controller';
import { LealtadService } from './lealtad.service';

@Module({
  imports: [ConfigModule],
  controllers: [LealtadController],
  providers: [LealtadService],
  exports: [LealtadService],
})
export class LealtadModule {}