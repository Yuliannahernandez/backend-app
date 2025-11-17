import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ClientesService {
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

  async getPerfil(usuarioId: number) {
    try {
      
      const response = await this.apiClient.get(`/usuarios/${usuarioId}`);
      const usuario = response.data;

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        telefono: usuario.telefono,
        edad: usuario.edad,
        fechaNacimiento: usuario.fechaNacimiento,
        puntosLealtad: usuario.puntosLealtad || 0,
        fotoPerfil: usuario.fotoPerfil,
        idioma: usuario.idioma,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async actualizarPerfil(usuarioId: number, data: any) {
    try {
      
      const updateData: any = {};
      
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.apellido !== undefined) updateData.apellido = data.apellido;
      if (data.telefono !== undefined) updateData.telefono = data.telefono;
      if (data.edad !== undefined) updateData.edad = data.edad;
      if (data.fechaNacimiento !== undefined) {
        updateData.fechaNacimiento = data.fechaNacimiento;
      }

      
      await this.apiClient.put(`/usuarios/${usuarioId}`, updateData);

      // Retornar perfil actualizado
      return this.getPerfil(usuarioId);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async getClienteByUsuarioId(usuarioId: number) {
    try {
      
      const response = await this.apiClient.get(`/usuarios/${usuarioId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

 

  async getClienteByEmail(correo: string) {
    try {
      const response = await this.apiClient.get(`/usuarios/email/${correo}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async getClienteByPhone(telefono: string) {
    try {
      const response = await this.apiClient.get(`/usuarios/by-phone/${telefono}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async actualizarUltimoAcceso(usuarioId: number) {
    try {
      await this.apiClient.put(`/usuarios/${usuarioId}/ultimo-acceso`);
    } catch (error) {
      console.error('Error actualizando último acceso:', error);
    }
  }

  async getPuntosLealtad(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/lealtad/usuario/${usuarioId}`);
      return response.data;
    } catch (error) {
      return { usuarioId, puntos: 0 };
    }
  }

  async actualizarPuntos(usuarioId: number, puntos: number) {
    try {
      const response = await this.apiClient.put(
        `/lealtad/usuario/${usuarioId}/puntos?puntos=${puntos}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}