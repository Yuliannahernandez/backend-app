
import { Controller, Get, Param, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { RecomendacionesService } from './recomendaciones.service';

@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(private readonly recomendacionesService: RecomendacionesService) {}

  @Get('mi-carrito')
  async getRecomendacionesCarrito(@Headers('authorization') auth: string) {
    try {
      let usuarioId = null;
      
      if (auth && auth.startsWith('Bearer ')) {
        try {
          const token = auth.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(token);
          usuarioId = decoded?.id || decoded?.sub;
        } catch (error) {
          console.error(' Error decodificando token:', error);
        }
      }
      
      if (!usuarioId) {
        usuarioId = 1; 
      }

      return await this.recomendacionesService.getRecomendacionesPorCarrito(usuarioId);
    } catch (error) {
      console.error(' Error obteniendo recomendaciones:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo recomendaciones',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('pedido/:pedidoId')
  async getRecomendacionesPorPedido(@Param('pedidoId') pedidoId: number) {
    try {
      return await this.recomendacionesService.getRecomendacionesPorPedido(pedidoId);
    } catch (error) {
      console.error(' Error obteniendo recomendaciones:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo recomendaciones',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categorias')
  async getCategorias() {
    try {
      return await this.recomendacionesService.getCategorias();
    } catch (error) {
      console.error(' Error obteniendo categorías:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo categorías',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}