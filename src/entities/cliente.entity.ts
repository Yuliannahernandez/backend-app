import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', unique: true })
  usuarioId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ nullable: true })
  edad: number;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 10, default: 'es' })
  idioma: string;

  @Column({ name: 'puntos_lealtad', default: 0 })
  puntosLealtad: number;

  @Column({ name: 'foto_perfil', length: 255, nullable: true })
  fotoPerfil: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date;

  @OneToOne(() => Usuario, usuario => usuario.cliente)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}