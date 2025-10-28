import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { CuponesService } from './cupones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AplicarCuponDto } from './dto/aplicar-cupon.dto';

class ValidarCuponDto {
  codigo: string;
}



@Controller('cupones')
@UseGuards(JwtAuthGuard)
export class CuponesController {
  constructor(private readonly cuponesService: CuponesService) {}

  @Post('validar')
  async validarCupon(@Request() req, @Body() data: ValidarCuponDto) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log('Validar cupón - Usuario ID:', usuarioId);
    return this.cuponesService.validarCupon(data.codigo, usuarioId);
  }

  @Post('aplicar')
  async aplicarCupon(@Request() req, @Body() data: AplicarCuponDto) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log('Aplicar cupón - Usuario ID:', usuarioId, 'Código:', data.codigo);
    return this.cuponesService.aplicarCuponAlCarrito(data.codigo, usuarioId);
  }

  @Delete('remover')
  async removerCupon(@Request() req) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log(' Remover cupón - Usuario ID:', usuarioId);
    return this.cuponesService.removerCuponDelCarrito(usuarioId);
  }

  @Get('disponibles')
  async getCuponesDisponibles(@Request() req) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log(' Cupones disponibles - Usuario ID:', usuarioId);
    return this.cuponesService.getCuponesDisponibles(usuarioId);
  }
}