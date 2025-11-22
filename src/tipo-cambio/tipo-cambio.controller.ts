
import { 
  Controller, 
  Get, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { TipoCambioService } from './tipo-cambio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tipo-cambio')
@UseGuards(JwtAuthGuard)
export class TipoCambioController {
  constructor(private readonly tipoCambioService: TipoCambioService) {}

  @Get('actual')
  async getTipoCambioActual() {
    console.log(' NestJS: Obteniendo tipo de cambio actual');
    return this.tipoCambioService.getTipoCambioActual();
  }


  @Get('convertir')
  async convertirMoneda(
    @Query('monto') monto: string,
    @Query('de') de?: string,
    @Query('a') a?: string,
  ) {
    const montoNumero = parseFloat(monto);
    
    if (isNaN(montoNumero)) {
      throw new Error('El monto debe ser un número válido');
    }

    console.log(` NestJS: Convirtiendo ${montoNumero} ${de || 'USD'} a ${a || 'CRC'}`);
    
    return this.tipoCambioService.convertirMoneda(
      montoNumero,
      de || 'USD',
      a || 'CRC'
    );
  }

 
}