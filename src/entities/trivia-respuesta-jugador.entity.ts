import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TriviaPartida } from './trivia-partida.entity';
import { TriviaPregunta } from './trivia-pregunta.entity';
import { TriviaRespuesta } from './trivia-respuesta.entity';

@Entity('trivia_respuestas_jugador')
export class TriviaRespuestaJugador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'partida_id', nullable: false })  
  partidaId: number;

  @ManyToOne(() => TriviaPartida, partida => partida.respuestas)
  @JoinColumn({ name: 'partida_id' })
  partida: TriviaPartida;

  @Column({ name: 'pregunta_id', nullable: false })  
  preguntaId: number;

  @ManyToOne(() => TriviaPregunta)
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: TriviaPregunta;

  @Column({ name: 'respuesta_seleccionada_id', nullable: false }) 
  respuestaSeleccionadaId: number;

  @ManyToOne(() => TriviaRespuesta)
  @JoinColumn({ name: 'respuesta_seleccionada_id' })
  respuestaSeleccionada: TriviaRespuesta;

  @Column({ name: 'es_correcta', type: 'boolean', nullable: false })  
  esCorrecta: boolean;

  @Column({ name: 'tiempo_respuesta_segundos', type: 'int', nullable: true })
  tiempoRespuestaSegundos: number;

  @CreateDateColumn({ name: 'fecha_respuesta' })
  fechaRespuesta: Date;
}