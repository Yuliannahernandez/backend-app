import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { LealtadService } from './lealtad.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, IsNotEmpty } from 'class-validator';

class CanjearRecompensaDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El ID de la recompensa es requerido' })
  recompensaId: number;
}

@Controller('lealtad')
@UseGuards(JwtAuthGuard)
export class LealtadController {
  constructor(private readonly lealtadService: LealtadService) {}

  @Get('puntos')
  async getPuntos(@Request() req) {
    const usuarioId = req.user.userId;
    console.log('Obtener puntos - Usuario ID:', usuarioId);
    return this.lealtadService.getPuntos(usuarioId);
  }

  @Get('historial')
  async getHistorial(@Request() req) {
   const usuarioId = req.user.userId;
    console.log('Obtener historial - Usuario ID:', usuarioId);
    return this.lealtadService.getHistorial(usuarioId);
  }

  @Get('recompensas')
  async getRecompensas() {
    console.log('Obtener recompensas disponibles');
    return this.lealtadService.getRecompensasDisponibles();
  }

  @Post('canjear')
  async canjearRecompensa(@Request() req, @Body() data: CanjearRecompensaDto) {
   const usuarioId = req.user.userId;

    
    console.log('Canjear recompensa - Usuario ID:', usuarioId);
    console.log('Body recibido:', data);
    console.log('Recompensa ID:', data.recompensaId);
    console.log('Tipo de recompensaId:', typeof data.recompensaId);
    
    if (!data.recompensaId) {
      throw new BadRequestException('El ID de la recompensa es requerido');
    }
    
    return this.lealtadService.canjearRecompensa(usuarioId, Number(data.recompensaId));
  }
}