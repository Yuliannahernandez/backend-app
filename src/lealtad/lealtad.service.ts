import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class LealtadService {
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

  async getPuntos(usuarioId: number) {
    console.log(' Obteniendo puntos para usuario:', usuarioId);

    try {
      const response = await this.apiClient.get(`/lealtad/usuario/${usuarioId}`);
      console.log(' Puntos del cliente:', response.data.puntos);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async getHistorial(usuarioId: number) {
    console.log(' Obteniendo historial para usuario:', usuarioId);

    try {
      const response = await this.apiClient.get(`/lealtad/historial/${usuarioId}`);
      console.log(` Historial encontrado: ${response.data.length} registros`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async getRecompensasDisponibles() {
    try {
      const response = await this.apiClient.get('/lealtad/recompensas');
      console.log(` Recompensas disponibles: ${response.data.length}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async canjearRecompensa(usuarioId: number, recompensaId: number) {
    console.log(' Canjeando recompensa:', recompensaId, 'para usuario:', usuarioId);

    try {
      const response = await this.apiClient.post('/lealtad/canjear', {
        usuarioId,
        recompensaId,
      });

      console.log(' Recompensa canjeada exitosamente');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Recurso no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'Error canjeando recompensa');
      }
      throw error;
    }
  }

  async agregarPuntosPorCompra(usuarioId: number, montoCompra: number, pedidoId: number) {
    console.log(' Agregando puntos por compra. Usuario:', usuarioId, 'Monto:', montoCompra);

    try {
      const response = await this.apiClient.post('/lealtad/agregar-puntos', {
        usuarioId,
        montoCompra,
        pedidoId,
      });

      console.log(' Puntos agregados exitosamente:', response.data.puntosGanados);
      return response.data.puntosGanados;
    } catch (error) {
      console.error('Error agregando puntos:', error);
      return 0;
    }
  }
}