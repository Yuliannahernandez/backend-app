

import { Controller, Get, Post, Body, Req, HttpException, HttpStatus, Headers } from '@nestjs/common';
import { SinpeService } from './sinpe.service';

@Controller('sinpe')
export class SinpeController {
  constructor(private readonly sinpeService: SinpeService) {}

  @Get('mi-cuenta')
  async getMiCuenta(@Headers('authorization') auth: string) {
    try {
      console.log(' getMiCuenta - Authorization header:', auth);
      
      // Extraer usuario del token JWT
      let usuarioId = null;
      
      if (auth && auth.startsWith('Bearer ')) {
        try {
          const token = auth.split(' ')[1];
          
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(token);
          usuarioId = decoded?.id || decoded?.sub;
          
          console.log(' Usuario extraído del token:', usuarioId);
        } catch (error) {
          console.error(' Error decodificando token:', error);
        }
      }
      
      
      if (!usuarioId) {
        console.log(' No hay token, usando usuario por defecto');
        usuarioId = 1; 
      }

      return await this.sinpeService.getMiCuenta(usuarioId);
    } catch (error) {
      console.error(' Error en getMiCuenta:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo cuenta',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('iniciar-transferencia')
  async iniciarTransferencia(@Body() body: any) {
    try {
      console.log('iniciarTransferencia - Body:', body);
      return await this.sinpeService.iniciarTransferencia(body);
    } catch (error) {
      console.error(' Error en iniciarTransferencia:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error iniciando transferencia',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verificar-codigo') 
  async verificarCodigo(@Body() body: any, @Req() req: any) {
    try {
      const user = req.user;
      console.log(' verificarCodigo - Usuario:', user?.id);
      console.log(' Body recibido:', body);
      
      return await this.sinpeService.verificarCodigo(body);
    } catch (error) {
      console.error(' Error en verificarCodigo:', error);
      

      const errorMessage = error.response?.data?.detail || error.message || 'Error verificando código';
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException(errorMessage, statusCode);
    }
  }

  @Get('transacciones')
  async getMisTransacciones(@Headers('authorization') auth: string) {
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

      return await this.sinpeService.getMisTransacciones(usuarioId);
    } catch (error) {
      console.error(' Error en getMisTransacciones:', error);
      throw new HttpException(
        error.response?.data || error.message || 'Error obteniendo transacciones',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}