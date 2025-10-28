import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgregarProductoDto } from './dto/agregar-producto.dto';



class ActualizarCantidadDto {
  cantidad: number;
}

class CambiarTipoEntregaDto {
  tipoEntrega: 'domicilio' | 'recoger_tienda';
}

@Controller('carrito')
@UseGuards(JwtAuthGuard)
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Get()
  async getCarrito(@Request() req) {
    return this.carritoService.getCarrito(req.user.sub || req.user.userId);
  }

 @Post('agregar')
async agregarProducto(@Request() req, @Body() data: AgregarProductoDto) {
 console.log('Data recibida:', data);
  return this.carritoService.agregarProducto(
   req.user.sub || req.user.userId,
      data.productoId,
      data.cantidad,
  );
}

@Put('metodopago')
async seleccionarMetodoPago(@Request() req, @Body() data: { metodoPagoId: string | number }) {
  return this.carritoService.seleccionarMetodoPago(
    req.user.sub || req.user.userId,
    data.metodoPagoId,
  );
}
  
  

  @Put('detalle/:id')
  async actualizarCantidad(
    @Request() req,
    @Param('id') id: number,
    @Body() data: ActualizarCantidadDto,
  ) {
    return this.carritoService.actualizarCantidad(
      req.user.sub || req.user.userId,
      id,
      data.cantidad,
    );
  }

  @Delete('detalle/:id')
  async eliminarProducto(@Request() req, @Param('id') id: number) {
    return this.carritoService.eliminarProducto(req.user.sub || req.user.userId, id);
  }

  @Put('tipo-entrega')
  async cambiarTipoEntrega(@Request() req, @Body() data: CambiarTipoEntregaDto) {
    return this.carritoService.cambiarTipoEntrega(
      req.user.sub || req.user.userId,
      data.tipoEntrega,
    );
  }

  @Put('sucursal')
async seleccionarSucursal(@Request() req, @Body() data: { sucursalId: number }) {
  return this.carritoService.seleccionarSucursal(
    req.user.sub || req.user.userId,
    data.sucursalId,
  );
}


  @Delete('vaciar')
  async vaciarCarrito(@Request() req) {
    return this.carritoService.vaciarCarrito(req.user.sub || req.user.userId);
  }
}