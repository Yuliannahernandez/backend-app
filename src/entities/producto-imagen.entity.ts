import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('producto_imagenes')
export class ProductoImagen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'producto_id' })
  productoId: number;

  @Column({ name: 'url_imagen', length: 255 })
  urlImagen: string;

  @Column({ default: 0 })
  orden: number;

  @ManyToOne(() => Producto, producto => producto.imagenes)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}