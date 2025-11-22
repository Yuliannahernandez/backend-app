
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TipoCambioService {
  private apiClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.apiClient = axios.create({
      baseURL: this.configService.get('PYTHON_API_URL') || 'http://localhost:8000',
      timeout: 10000,
    });
  }

  async getTipoCambioActual() {
    try {
      const response = await this.apiClient.get('/tipo-cambio/actual');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tipo de cambio:', error);

      return this.getTipoCambioCache();
    }
  }

  async getTipoCambioCache() {
    try {
      const response = await this.apiClient.get('/tipo-cambio/cache');
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo caché:', error);
      throw new HttpException(
        'Error al obtener tipo de cambio',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async convertirMoneda(monto: number, de: string, a: string) {
    try {
      const response = await this.apiClient.get('/tipo-cambio/convertir', {
        params: { monto, de, a }
      });
      return response.data;
    } catch (error) {
      console.error('Error convirtiendo moneda:', error);
      throw new HttpException(
        'Error al convertir moneda',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}