import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TriviaController } from './trivia.controller';
import { TriviaService } from './trivia.service';

@Module({
  imports: [ConfigModule],
  controllers: [TriviaController],
  providers: [TriviaService],
  exports: [TriviaService],
})
export class TriviaModule {}