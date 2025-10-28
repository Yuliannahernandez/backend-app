import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('recompensas')
export class Recompensa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'puntos_requeridos' })
  puntosRequeridos: number;

  @Column({
    type: 'enum',
    enum: ['descuento', 'producto_gratis', 'cupon'],
  })
  tipo: string;

  @Column({ length: 100, nullable: true })
  valor: string;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}