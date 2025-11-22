
import { Controller, Get, Post, Delete, Param, Headers, HttpException, HttpStatus, Body } from '@nestjs/common';
import { FavoritosService } from './favoritos.service';

@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get('mis-favoritos')
  async getMisFavoritos(@Headers('authorization') auth: string) {
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

      return await this.favoritosService.getMisFavoritos(usuarioId);
    } catch (error) {
      console.error(' Error obteniendo favoritos:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo favoritos',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('toggle/:productoId')
  async toggleFavorito(
    @Param('productoId') productoId: number,
    @Headers('authorization') auth: string
  ) {
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

      return await this.favoritosService.toggleFavorito(usuarioId, productoId);
    } catch (error) {
      console.error(' Error en toggle favorito:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error procesando favorito',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('es-favorito/:productoId')
  async esFavorito(
    @Param('productoId') productoId: number,
    @Headers('authorization') auth: string
  ) {
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
        return { esFavorito: false };
      }

      return await this.favoritosService.esFavorito(usuarioId, productoId);
    } catch (error) {
      console.error(' Error verificando favorito:', error);
      return { esFavorito: false };
    }
  }
}