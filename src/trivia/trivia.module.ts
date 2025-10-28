import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriviaController } from './trivia.controller';
import { TriviaService } from './trivia.service';
import { Cliente } from '../entities/cliente.entity';
import { TriviaPregunta } from '../entities/trivia-pregunta.entity';
import { TriviaRespuesta } from '../entities/trivia-respuesta.entity';
import { TriviaPartida } from '../entities/trivia-partida.entity';
import { TriviaRespuestaJugador } from '../entities/trivia-respuesta-jugador.entity';
import { Cupon } from '../entities/cupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      TriviaPregunta,
      TriviaRespuesta,
      TriviaPartida,
      TriviaRespuestaJugador,
      Cupon,
    ]),
  ],
  controllers: [TriviaController],
  providers: [TriviaService],
  exports: [TriviaService],
})
export class TriviaModule {}