// backend-app/src/tarjetas/tarjetas.controller.ts
import { Controller, Post, Get, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { TarjetasService } from './tarjetas.service';

@Controller('tarjetas')
export class TarjetasController {
  constructor(private readonly tarjetasService: TarjetasService) {}

  @Post('validar')
  async validarTarjeta(@Body() body: any) {
    try {
      return await this.tarjetasService.validarTarjeta(body);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('procesar-pago')
  async procesarPago(
    @Body() body: any,
    @Headers('authorization') auth: string
  ) {
    try {
      let usuarioId = this.extractUserId(auth);
      return await this.tarjetasService.procesarPago(usuarioId, body);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tarjetas-prueba')
  async getTarjetasPrueba() {
    try {
      return await this.tarjetasService.getTarjetasPrueba();
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private extractUserId(auth: string): number {
    let usuarioId = null;
    
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const token = auth.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        usuarioId = decoded?.id || decoded?.sub;
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    if (!usuarioId) {
      usuarioId = 1;
    }

    return usuarioId;
  }
}