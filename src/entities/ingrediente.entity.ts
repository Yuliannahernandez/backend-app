import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingredientes')
export class Ingrediente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ name: 'es_alergeno', default: false })
  esAlergeno: boolean;
}