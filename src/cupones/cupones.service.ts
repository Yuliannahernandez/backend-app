import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CuponesService {
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

  async validarCupon(codigo: string, usuarioId: number) {
    console.log('🔍 Validando cupón:', codigo, 'para usuario:', usuarioId);

    // Validar código
    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      throw new BadRequestException('El código de cupón es requerido y debe ser texto válido');
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    try {
      // Llamar al endpoint de validación
      const response = await this.apiClient.post('/cupones/validar', {
        codigo: codigoNormalizado,
        usuarioId,
      });

      console.log('✅ Cupón válido:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Cupón no encontrado o inactivo');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'Cupón no válido');
      }
      throw error;
    }
  }

  async aplicarCuponAlCarrito(codigo: string, usuarioId: number) {
    console.log('🎟️ Aplicando cupón:', codigo, 'para usuario:', usuarioId);

    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      throw new BadRequestException('El código de cupón es requerido');
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    try {
      // Aplicar cupón al carrito
      const response = await this.apiClient.post('/cupones/aplicar', {
        codigo: codigoNormalizado,
        usuarioId,
      });

      console.log('✅ Cupón aplicado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error aplicando cupón:', error.response?.data?.detail);
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Recurso no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'Error aplicando cupón');
      }
      throw error;
    }
  }

  async removerCuponDelCarrito(usuarioId: number) {
    try {
      const response = await this.apiClient.delete(`/cupones/remover/${usuarioId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('No tienes un carrito activo');
      }
      throw error;
    }
  }

  async getCuponesDisponibles(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/cupones/disponibles/${usuarioId}`);
      console.log(`📋 Cupones disponibles: ${response.data.length}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async registrarUsoCupon(cuponCodigo: string, clienteId: number, pedidoId: number) {
    console.log('📝 Registrando uso de cupón:', cuponCodigo);

    try {
      await this.apiClient.post('/cupones/registrar-uso', {
        cuponCodigo,
        clienteId,
        pedidoId,
      });
      console.log('✅ Uso de cupón registrado');
    } catch (error) {
      console.error('❌ Error registrando uso:', error);
    }
  }

  // Métodos adicionales útiles
  async getCuponPorCodigo(codigo: string) {
    try {
      const response = await this.apiClient.get(`/cupones/codigo/${codigo}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cupón no válido o expirado');
      }
      throw error;
    }
  }

  async getAllCupones() {
    try {
      const response = await this.apiClient.get('/cupones');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}