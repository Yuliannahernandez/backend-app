import { Controller, Get, Post, Put, Param, UseGuards, Request, ParseIntPipe, Query,Body } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

   // ← NUEVO ENDPOINT PARA CREAR DESDE CARRITO
  @Post('crear-desde-carrito')
  async crearPedidoDesdeCarrito(
    @Request() req,
    @Body() body: any
  ) {
    const usuarioId = req.user.sub || req.user.userId;
    
    console.log('📦 Creando pedido desde carrito para usuario:', usuarioId);
    console.log('📦 Body recibido:', body);
    
    // Agregar usuario_id al body
    const payload = {
      usuario_id: usuarioId,
      ...body
    };
    
    return this.pedidosService.crearPedidoDesdeCarrito(payload);
  }

 
  @Put(':pedidoId')
  async actualizarSucursal(
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    console.log(` Actualizando pedido ${pedidoId} con sucursal ${sucursalId}`);
    return this.pedidosService.actualizarSucursal(pedidoId, sucursalId);
  }

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