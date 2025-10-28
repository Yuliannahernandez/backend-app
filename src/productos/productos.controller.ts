import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  async getProductos(@Query('categoria') categoriaId?: number) {
    return this.productosService.getProductos(categoriaId);
  }

  @Get('nuevos')
  async getProductosNuevos() {
    return this.productosService.getProductosNuevos();
  }

  @Get('tendencia')
  async getProductosTendencia() {
    return this.productosService.getProductosTendencia();
  }

  @Get('destacado')
  async getProductoDestacado() {
    return this.productosService.getProductoDestacado();
  }

  @Get('categorias')
  async getCategorias() {
    return this.productosService.getCategorias();
  }

  @Get(':id')
  async getProducto(@Param('id') id: number) {
    return this.productosService.getProductoDetalle(id);
  }
}