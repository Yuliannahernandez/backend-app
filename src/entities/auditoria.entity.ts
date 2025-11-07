import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

export enum AccionAuditoria {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  SELECT = 'select',
}

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ length: 50 })
  tabla: string;

  @Column({
    type: 'enum',
    enum: AccionAuditoria,
  })
  accion: AccionAuditoria;

  @Column({ name: 'registro_id' })
  registroId: number;

  @Column({ type: 'json', nullable: true, name: 'datos_anteriores' })
  datosAnteriores: any;

  @Column({ type: 'json', nullable: true, name: 'datos_nuevos' })
  datosNuevos: any;

  @Column({ length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @CreateDateColumn()
  fecha: Date;


  @Column({ length: 255, nullable: true })
  descripcion: string;

  @Column({ length: 100, nullable: true })
  endpoint: string;

  @Column({ length: 10, nullable: true })
  metodo: string; // GET, POST, PUT, DELETE
}