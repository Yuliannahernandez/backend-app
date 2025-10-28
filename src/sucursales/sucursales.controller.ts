import { Controller, Get, UseGuards } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  async getSucursales() {
    return this.sucursalesService.getSucursalesActivas();
  }
}