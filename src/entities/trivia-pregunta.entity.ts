import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { TriviaRespuesta } from './trivia-respuesta.entity';

@Entity('trivia_preguntas')
export class TriviaPregunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  pregunta: string;

  @Column({ length: 50, default: 'cine' })
  categoria: string;

  @Column({
    type: 'enum',
    enum: ['facil', 'media', 'dificil'],
    default: 'media',
  })
  dificultad: string;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @OneToMany(() => TriviaRespuesta, respuesta => respuesta.pregunta)
  respuestas: TriviaRespuesta[];
}