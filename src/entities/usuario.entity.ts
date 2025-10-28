import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  correo: string;

  @Column({ name: 'password_hash', nullable: true })  
  passwordHash: string;

  @Column({ name: 'rol', type: 'varchar', length: 50, default: 'cliente' }) 
  rol: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'activo' })
  estado: string;

  @Column({ name: 'google_id', nullable: true })  
  googleId: string;

  @Column({ name: 'is_google_auth', default: false }) 
  isGoogleAuth: boolean;

  @Column({ name: 'is_2fa_enabled', default: false })  
  is2FAEnabled: boolean;

  @Column({ name: 'two_fa_secret', nullable: true })  
  twoFASecret: string;

  @Column({ name: 'token_recuperacion', nullable: true })
  tokenRecuperacion: string;

  @Column({ name: 'token_expiracion', type: 'timestamp', nullable: true })
  tokenExpiracion: Date;

  @CreateDateColumn({ name: 'fecha_registro' })  
  fechaCreacion: Date;

  @Column({ name: 'ultimo_acceso', type: 'timestamp', nullable: true })
  ultimoAcceso: Date;


  @OneToOne(() => Cliente, (cliente) => cliente.usuario)
  cliente: Cliente;

  
  // ==================== CAMPOS DE VERIFICACIÓN DE EMAIL ====================
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiry: Date;


}