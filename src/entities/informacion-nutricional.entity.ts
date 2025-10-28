import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('informacion_nutricional')
export class InformacionNutricional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'producto_id', unique: true })
  productoId: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  calorias: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  proteinas: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  carbohidratos: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  grasas: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  fibra: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  sodio: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  azucares: number;

  @Column({ length: 50, nullable: true })
  porcion: string;

  @OneToOne(() => Producto, producto => producto.informacionNutricional)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}