import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Categoria } from './categoria.entity';
import { ProductoImagen } from './producto-imagen.entity';
import { ProductoIngrediente } from './producto-ingrediente.entity';
import { InformacionNutricional } from './informacion-nutricional.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'categoria_id' })
  categoriaId: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ name: 'imagen_principal', length: 255, nullable: true })
  imagenPrincipal: string;

  @Column({ name: 'es_nuevo', default: false })
  esNuevo: boolean;

  @Column({ name: 'en_tendencia', default: false })
  enTendencia: boolean;

  @Column({ default: true })
  disponible: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'tiempo_preparacion', default: 15 })
  tiempoPreparacion: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @OneToMany(() => ProductoImagen, imagen => imagen.producto)
  imagenes: ProductoImagen[];

  @OneToMany(() => ProductoIngrediente, pi => pi.producto)
  ingredientes: ProductoIngrediente[];

  @OneToOne(() => InformacionNutricional, info => info.producto)
  informacionNutricional: InformacionNutricional;
}