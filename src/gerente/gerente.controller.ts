import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { GerenteService, ActualizarProductoDto, CrearProductoDto } from './gerente.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/decorators/roles.decorator';

@Controller('gerente')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gerente', 'admin')
export class GerenteController {
  constructor(private readonly gerenteService: GerenteService) {}

  // ==================== PRODUCTOS ====================

  @Get('productos')
  async getProductos() {
    return this.gerenteService.getProductosGestion();
  }

  @Post('productos')
  async crearProducto(@Body() data: CrearProductoDto) {
    return this.gerenteService.crearProducto(data);
  }

  @Put('productos/:id')
  async actualizarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ActualizarProductoDto,
  ) {
    return this.gerenteService.actualizarProducto(id, data);
  }

  @Put('productos/:id/toggle-disponibilidad')
  async toggleDisponibilidad(@Param('id', ParseIntPipe) id: number) {
    return this.gerenteService.toggleDisponibilidad(id);
  }

  @Delete('productos/:id')
  async eliminarProducto(@Param('id', ParseIntPipe) id: number) {
    return this.gerenteService.eliminarProducto(id);
  }

  // ==================== PEDIDOS ====================

  @Get('pedidos/activos')
  async getPedidosActivos() {
    return this.gerenteService.getPedidosActivos();
  }

  @Put('pedidos/:id/estado')
  async cambiarEstadoPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    return this.gerenteService.cambiarEstadoPedido(id, estado);
  }

  // ==================== REPORTES ====================

  @Get('reportes/ventas')
  async getReporteVentas(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.gerenteService.getReporteVentas(fechaInicio, fechaFin);
  }

  @Get('metricas')
  async getMetricas() {
    return this.gerenteService.getMetricasGenerales();
  }
}