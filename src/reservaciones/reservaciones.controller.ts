
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Put,
  Param, 
  Body,
  Query,
  Headers, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ReservacionesService } from './reservaciones.service';

@Controller('reservaciones')
export class ReservacionesController {
  constructor(private readonly reservacionesService: ReservacionesService) {}

  @Get('disponibilidad')
  async getDisponibilidad(
    @Query('sucursal_id') sucursalId: number,
    @Query('fecha') fecha: string
  ) {
    try {
      return await this.reservacionesService.getDisponibilidad(sucursalId, fecha);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('crear')
  async crearReservacion(
    @Body() body: any,
    @Headers('authorization') auth: string
  ) {
    try {
      let usuarioId = this.extractUserId(auth);
      return await this.reservacionesService.crearReservacion(usuarioId, body);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('mis-reservaciones')
  async getMisReservaciones(@Headers('authorization') auth: string) {
    try {
      let usuarioId = this.extractUserId(auth);
      return await this.reservacionesService.getMisReservaciones(usuarioId);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sucursales/disponibles')
  async getSucursalesDisponibles() {
    try {
      return await this.reservacionesService.getSucursalesDisponibles();
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getDetalleReservacion(
    @Param('id') id: number,
    @Headers('authorization') auth: string
  ) {
    try {
      let usuarioId = this.extractUserId(auth);
      return await this.reservacionesService.getDetalleReservacion(usuarioId, id);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/cancelar')
  async cancelarReservacion(
    @Param('id') id: number,
    @Headers('authorization') auth: string
  ) {
    try {
      let usuarioId = this.extractUserId(auth);
      return await this.reservacionesService.cancelarReservacion(usuarioId, id);
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
        console.error(' Error decodificando token:', error);
      }
    }
    
    if (!usuarioId) {
      usuarioId = 1; 
    }

    return usuarioId;
  }
}