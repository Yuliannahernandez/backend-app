import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  UseInterceptors 
} from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgregarProductoDto } from './dto/agregar-producto.dto';
import { AuditoriaInterceptor, Auditar } from '../common/interceptors/auditoria.interceptor';
import { AccionAuditoria } from '../entities/auditoria.entity';

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

  // ==================== OBTENER CARRITO ====================
  @Get()
  @Auditar({ 
    tabla: 'carrito', 
    accion: AccionAuditoria.SELECT,
    descripcion: 'Consulta de carrito de compras'
  })
  async getCarrito(@Request() req) {
    return this.carritoService.getCarrito(req.user.sub || req.user.userId);
  }

  // ==================== AGREGAR PRODUCTO AL CARRITO ====================
  @Post('agregar')
  @Auditar({ 
    tabla: 'carrito_detalle', 
    accion: AccionAuditoria.INSERT,
    descripcion: 'Producto agregado al carrito'
  })
  async agregarProducto(@Request() req, @Body() data: AgregarProductoDto) {
    console.log('Data recibida:', data);
    return this.carritoService.agregarProducto(
      req.user.sub || req.user.userId,
      data.productoId,
      data.cantidad,
    );
  }

  // ==================== SELECCIONAR MÉTODO DE PAGO ====================
  @Put('metodopago')
  @Auditar({ 
    tabla: 'carrito', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Método de pago seleccionado'
  })
  async seleccionarMetodoPago(@Request() req, @Body() data: { metodoPagoId: string | number }) {
    return this.carritoService.seleccionarMetodoPago(
      req.user.sub || req.user.userId,
      data.metodoPagoId,
    );
  }

  // ==================== ACTUALIZAR CANTIDAD ====================
  @Put('detalle/:id')
  @Auditar({ 
    tabla: 'carrito_detalle', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Cantidad de producto actualizada'
  })
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

  // ==================== ELIMINAR PRODUCTO ====================
  @Delete('detalle/:id')
  @Auditar({ 
    tabla: 'carrito_detalle', 
    accion: AccionAuditoria.DELETE,
    descripcion: 'Producto eliminado del carrito'
  })
  async eliminarProducto(@Request() req, @Param('id') id: number) {
    return this.carritoService.eliminarProducto(req.user.sub || req.user.userId, id);
  }

  // ==================== CAMBIAR TIPO DE ENTREGA ====================
  @Put('tipo-entrega')
  @Auditar({ 
    tabla: 'carrito', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Tipo de entrega modificado'
  })
  async cambiarTipoEntrega(@Request() req, @Body() data: CambiarTipoEntregaDto) {
    return this.carritoService.cambiarTipoEntrega(
      req.user.sub || req.user.userId,
      data.tipoEntrega,
    );
  }

  // ==================== SELECCIONAR SUCURSAL ====================
  @Put('sucursal')
  @Auditar({ 
    tabla: 'carrito', 
    accion: AccionAuditoria.UPDATE,
    descripcion: 'Sucursal de retiro seleccionada'
  })
  async seleccionarSucursal(@Request() req, @Body() data: { sucursalId: number }) {
    return this.carritoService.seleccionarSucursal(
      req.user.sub || req.user.userId,
      data.sucursalId,
    );
  }

  // ==================== VACIAR CARRITO ====================
  @Delete('vaciar')
  @Auditar({ 
    tabla: 'carrito', 
    accion: AccionAuditoria.DELETE,
    descripcion: 'Carrito vaciado completamente'
  })
  async vaciarCarrito(@Request() req) {
    return this.carritoService.vaciarCarrito(req.user.sub || req.user.userId);
  }
}