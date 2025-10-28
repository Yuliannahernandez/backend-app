import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Cliente } from '../entities/cliente.entity';
import { Direccion } from '../entities/direccion.entity';
import { MetodoPago } from '../entities/metodopago.entity';
import { CondicionSalud } from '../entities/condicionsalud.entity';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [
    
    TypeOrmModule.forFeature([
      AuthModule,
      Cliente,
      Direccion,
      MetodoPago,
      CondicionSalud,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}