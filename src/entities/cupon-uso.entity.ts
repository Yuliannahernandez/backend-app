import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cupon } from './cupon.entity';
import { Cliente } from './cliente.entity';
import { Pedido } from './pedido.entity';

@Entity('cupon_usos')
export class CuponUso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cupon_id' })
  cuponId: number;

  @ManyToOne(() => Cupon)
  @JoinColumn({ name: 'cupon_id' })
  cupon: Cupon;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'pedido_id' })
  pedidoId: number;

  @ManyToOne(() => Pedido)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'descuento_aplicado' })
  descuentoAplicado: number;

  @CreateDateColumn({ name: 'fecha_uso' })
  fechaUso: Date;
}