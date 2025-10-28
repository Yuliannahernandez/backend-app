import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TriviaPregunta } from './trivia-pregunta.entity';

@Entity('trivia_respuestas')
export class TriviaRespuesta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pregunta_id' })
  preguntaId: number;

  @ManyToOne(() => TriviaPregunta, pregunta => pregunta.respuestas)
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: TriviaPregunta;

  @Column({ type: 'text' })
  respuesta: string;

  @Column({ name: 'es_correcta', default: false })
  esCorrecta: boolean;
}