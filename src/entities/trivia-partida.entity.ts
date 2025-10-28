import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Pedido } from './pedido.entity';
import { Cupon } from '../entities/cupon.entity';
import { TriviaRespuestaJugador } from '../entities/trivia-respuesta-jugador.entity';

@Entity('trivia_partidas')
export class TriviaPartida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'pedido_id', nullable: true })
  pedidoId: number;

  @ManyToOne(() => Pedido, { nullable: true })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'puntaje_total', default: 0 })
  puntajeTotal: number;

  @Column({ name: 'preguntas_correctas', default: 0 })
  preguntasCorrectas: number;

  @Column({ name: 'preguntas_totales', default: 0 })
  preguntasTotales: number;

  @Column({ name: 'cupon_ganado_id', nullable: true })
  cuponGanadoId: number;

  @ManyToOne(() => Cupon, { nullable: true })
  @JoinColumn({ name: 'cupon_ganado_id' })
  cuponGanado: Cupon;

  @Column({ name: 'tiempo_total_segundos', nullable: true })
  tiempoTotalSegundos: number;

  @Column({ default: false })
  completada: boolean;

  @CreateDateColumn({ name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin: Date;

  @OneToMany(() => TriviaRespuestaJugador, respuesta => respuesta.partida)
  respuestas: TriviaRespuestaJugador[];
}