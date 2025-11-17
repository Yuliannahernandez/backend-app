import { Injectable } from '@nestjs/common';
import { DatabaseApiService } from '../common/services/database-api.service';

@Injectable()
export class SucursalesService {
  constructor(private readonly dbApi: DatabaseApiService) {}

  async getSucursalesActivas() {
    return this.dbApi.findAllSucursales();
  }
}