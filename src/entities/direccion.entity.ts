import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('direcciones')
export class Direccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ length: 50, nullable: true })
  alias: string;

  @Column({ name: 'direccion_completa', type: 'text' })
  direccionCompleta: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ length: 100 })
  provincia: string;

  @Column({ name: 'codigo_postal', length: 20, nullable: true })
  codigoPostal: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitud: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitud: number;

  @Column({ type: 'text', nullable: true })
  referencia: string;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;
}