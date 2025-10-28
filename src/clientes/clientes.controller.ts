import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class ActualizarPerfilDto {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  edad?: number;
  fechaNacimiento?: string;
}

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('perfil')
  async getPerfil(@Request() req) {
    const usuarioId = req.user.sub || req.user.userId;
    return this.clientesService.getPerfil(usuarioId);
  }

  @Put('perfil')
  async actualizarPerfil(@Request() req, @Body() data: ActualizarPerfilDto) {
    const usuarioId = req.user.sub || req.user.userId;
    return this.clientesService.actualizarPerfil(usuarioId, data);
  }
}