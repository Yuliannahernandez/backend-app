
import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TseService } from './tse.service';

@Controller('tse')
export class TseController {
  constructor(private readonly tseService: TseService) {}

  @Post('validar-cedula')
  async validarCedula(@Body() body: any) {
    try {
      return await this.tseService.validarCedula(body.numero_cedula);
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('cedulas-prueba')
  async getCedulasPrueba() {
    try {
      return await this.tseService.getCedulasPrueba();
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}