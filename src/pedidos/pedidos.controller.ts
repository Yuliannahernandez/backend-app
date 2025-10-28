import { Controller, Get, Post, Put, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post('crear')
  async crearPedido(@Request() req) {
    console.log('Creando pedido para usuario:', req.user.sub || req.user.userId);
    return this.pedidosService.crearPedidoDesdeCarrito(
      req.user.sub || req.user.userId
    );
  }

  @Get('mis-pedidos')
  async getMisPedidos(@Request() req) {
    return this.pedidosService.getMisPedidos(
      req.user.sub || req.user.userId
    );
  }

  @Get(':id')
  async getPedido(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.getPedido(
      req.user.sub || req.user.userId,
      id
    );
  }

  @Put(':id/cancelar')
  async cancelarPedido(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.cancelarPedido(
      req.user.sub || req.user.userId,
      id
    );
  }
}