import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('condiciones_salud')
export class CondicionSalud {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;
}