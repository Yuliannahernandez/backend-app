import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 255, nullable: true })
  icono: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ default: true })
  activa: boolean;
}