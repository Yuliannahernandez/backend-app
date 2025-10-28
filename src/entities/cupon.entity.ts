import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('cupones')
export class Cupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: ['porcentaje', 'monto_fijo'],
    name: 'tipo_descuento',
  })
  tipoDescuento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valor_descuento' })
  valorDescuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'monto_minimo' })
  montoMinimo: number;

  @Column({ type: 'date', name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'date', name: 'fecha_fin' })
  fechaFin: Date;

  @Column({ name: 'usos_maximos', nullable: true })
  usosMaximos: number;

  @Column({ name: 'usos_por_cliente', default: 1 })
  usosPorCliente: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}