// localidades/localidades.controller.ts

import { 
  Controller, 
  Get, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { LocalidadesService } from './localidades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('localidades')
@UseGuards(JwtAuthGuard)
export class LocalidadesController {
  constructor(private readonly localidadesService: LocalidadesService) {}

  @Get('paises')
  async getPaises() {
    return this.localidadesService.getPaises();
  }

  @Get('hijos/:padreId')
  async getHijos(@Param('padreId') padreId: number) {
    return this.localidadesService.getHijos(padreId);
  }

  @Get('jerarquia/:localidadId')
  async getJerarquia(@Param('localidadId') localidadId: number) {
    return this.localidadesService.getJerarquia(localidadId);
  }
}