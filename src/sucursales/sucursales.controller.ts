import { Controller, Get, UseGuards } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';

@Controller('sucursales')

export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  async getSucursales() {
    return this.sucursalesService.getSucursalesActivas();
  }
}