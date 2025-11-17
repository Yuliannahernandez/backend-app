

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class LocalidadesService {
  private apiClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.apiClient = axios.create({
      baseURL: this.configService.get('PYTHON_API_URL') || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getPaises() {
    try {
      console.log(' NestJS: Obteniendo países');
      
      const response = await this.apiClient.get('/localidades/paises');
      
      console.log(' NestJS: Países obtenidos:', response.data.length);
      
      return response.data;
    } catch (error) {
      console.error(' NestJS: Error obteniendo países:', error.response?.data);
      throw error;
    }
  }

  async getHijos(padreId: number) {
    try {
      console.log(` NestJS: Obteniendo hijos de localidad ${padreId}`);
      
      const response = await this.apiClient.get(`/localidades/hijos/${padreId}`);
      
      console.log('NestJS: Hijos obtenidos:', response.data.length);
      
      return response.data;
    } catch (error) {
      console.error(' NestJS: Error obteniendo hijos:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new NotFoundException('Localidad no encontrada');
      }
      throw error;
    }
  }

  async getJerarquia(localidadId: number) {
    try {
      console.log(` NestJS: Obteniendo jerarquía de localidad ${localidadId}`);
      
      const response = await this.apiClient.get(`/localidades/jerarquia/${localidadId}`);
      
      console.log(' NestJS: Jerarquía obtenida');
      
      return response.data;
    } catch (error) {
      console.error(' NestJS: Error obteniendo jerarquía:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new NotFoundException('Localidad no encontrada');
      }
      throw error;
    }
  }
}