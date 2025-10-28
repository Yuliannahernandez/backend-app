import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Pedido } from './pedido.entity';
import { Recompensa } from './recompensa.entity';

@Entity('puntos_historial')
export class PuntosHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  puntos: number;

  @Column({
    type: 'enum',
    enum: ['ganado', 'canjeado', 'expirado'],
  })
  tipo: string;

  @Column({ name: 'pedido_id', nullable: true })
  pedidoId: number;

  @ManyToOne(() => Pedido, { nullable: true })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'recompensa_id', nullable: true })
  recompensaId: number;

  @ManyToOne(() => Recompensa, { nullable: true })
  @JoinColumn({ name: 'recompensa_id' })
  recompensa: Recompensa;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn()
  fecha: Date;
}