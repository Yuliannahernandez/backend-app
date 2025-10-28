import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('metodos_pago')
export class MetodoPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({
    type: 'enum',
    enum: ['tarjeta_credito', 'tarjeta_debito', 'efectivo', 'transferencia'],
  })
  tipo: string;

  @Column({ length: 50, nullable: true })
  alias: string;

  @Column({ name: 'ultimos_digitos', length: 4, nullable: true })
  ultimosDigitos: string;

  @Column({ length: 50, nullable: true })
  marca: string;

  @Column({ name: 'nombre_titular', length: 100, nullable: true })
  nombreTitular: string;

  @Column({ name: 'fecha_expiracion', type: 'date', nullable: true })
  fechaExpiracion: Date;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'token_pago', length: 255, nullable: true })
  tokenPago: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;
}