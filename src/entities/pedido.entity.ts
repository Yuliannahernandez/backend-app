import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PedidoDetalle } from './pedido-detalle.entity';
import { Sucursal } from './sucursal.entity';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'direccion_id', nullable: true })
  direccionId: number;

  @Column({ name: 'metodo_pago_id', nullable: true })
  metodoPagoId: number;

  @Column({ name: 'sucursal_id', nullable: true })
  sucursalId: number;

  
  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @Column({
    type: 'enum',
    enum: ['domicilio', 'recoger_tienda'],
    name: 'tipo_entrega',
  })
  tipoEntrega: string;

  @Column({
    type: 'enum',
    enum: ['carrito', 'recibido', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'completado', 'cancelado'],
    default: 'carrito',
  })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ name: 'costo_envio', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoEnvio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'tiempo_estimado', nullable: true })
  tiempoEstimado: number;

  @Column({ name: 'cupon_aplicado', length: 50, nullable: true })
  cuponAplicado: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_confirmacion', type: 'timestamp', nullable: true })
  fechaConfirmacion: Date;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado: Date;

  @OneToMany(() => PedidoDetalle, detalle => detalle.pedido)
  detalles: PedidoDetalle[];
}