import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';
import { Ingrediente } from './ingrediente.entity'; 

@Entity('producto_ingredientes')
export class ProductoIngrediente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'producto_id' })
  productoId: number;

  @Column({ name: 'ingrediente_id' })
  ingredienteId: number;

  @Column({ length: 50, nullable: true })
  cantidad: string;

  @ManyToOne(() => Producto, producto => producto.ingredientes)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Ingrediente)
  @JoinColumn({ name: 'ingrediente_id' })
  ingrediente: Ingrediente;
} 