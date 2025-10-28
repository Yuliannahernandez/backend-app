import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  async getCategorias() {
    return this.categoriasService.getCategorias();
  }

  @Get(':id/productos')
  async getProductosPorCategoria(@Param('id') id: number) {
    return this.categoriasService.getProductosPorCategoria(id);
  }
}