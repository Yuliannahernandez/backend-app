import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { UpdateProfileDto, CreateDireccionDto, CreateMetodoPagoDto, AddCondicionSaludDto } from '../auth/dto/profile.dto';

@Injectable()
export class ProfileService {
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

  // ============ PERFIL ============
  async getProfile(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/profile/${usuarioId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Perfil no encontrado');
      }
      throw error;
    }
  }

  async updateProfile(usuarioId: number, updateData: UpdateProfileDto) {
    try {
      const response = await this.apiClient.put(`/profile/${usuarioId}`, updateData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Perfil no encontrado');
      }
      throw error;
    }
  }

  async updateFotoPerfil(usuarioId: number, file: Express.Multer.File) {
    try {
      const imageUrl = file.filename;
      
      const response = await this.apiClient.put(`/profile/${usuarioId}/foto`, {
        fotoPerfil: imageUrl,
      });

      return {
        message: 'Foto actualizada correctamente',
        fotoPerfil: imageUrl,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  // ============ DIRECCIONES ============
  async getDirecciones(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/profile/${usuarioId}/direcciones`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async createDireccion(usuarioId: number, createData: CreateDireccionDto) {
  try {
   
    const response = await this.apiClient.post(
      `/profile/${usuarioId}/direcciones`, 
      createData  
    );
    return response.data;
  } catch (error) {
    console.error('Error de Python:', error.response?.data);
    if (error.response?.status === 404) {
      throw new NotFoundException('Cliente no encontrado');
    }
    throw error;
  }
}

  async updateDireccion(usuarioId: number, direccionId: number, updateData: CreateDireccionDto) {
    try {
      const response = await this.apiClient.put(
        `/profile/${usuarioId}/direcciones/${direccionId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Dirección no encontrada');
      }
      throw error;
    }
  }

  async deleteDireccion(usuarioId: number, direccionId: number) {
    try {
      const response = await this.apiClient.delete(`/profile/${usuarioId}/direcciones/${direccionId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Dirección no encontrada');
      }
      throw error;
    }
  }

  // ============ MÉTODOS DE PAGO ============
  async getMetodosPago(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/profile/${usuarioId}/metodos-pago`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async createMetodoPago(usuarioId: number, createData: CreateMetodoPagoDto) {
    try {
      const response = await this.apiClient.post(`/profile/${usuarioId}/metodos-pago`, createData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async updateMetodoPago(usuarioId: number, metodoPagoId: number, updateData: CreateMetodoPagoDto) {
    try {
      const response = await this.apiClient.put(
        `/profile/${usuarioId}/metodos-pago/${metodoPagoId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Método de pago no encontrado');
      }
      throw error;
    }
  }

  async deleteMetodoPago(usuarioId: number, metodoPagoId: number) {
    try {
      const response = await this.apiClient.delete(
        `/profile/${usuarioId}/metodos-pago/${metodoPagoId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Método de pago no encontrado');
      }
      throw error;
    }
  }

async getCondicionesSalud() {
  try {
    console.log('Llamando a Python: /profile/condiciones-salud');
    const response = await this.apiClient.get('/profile/condiciones-salud');
    console.log('Respuesta de Python:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener condiciones de salud:', error.response?.data || error.message);
    throw error;
  }
}

async getClienteCondiciones(usuarioId: number) {
  try {
    const response = await this.apiClient.get(`/profile/${usuarioId}/condiciones-salud`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

async addCondicionesSalud(usuarioId: number, data: AddCondicionSaludDto) {
  try {
    const response = await this.apiClient.post(
      `/profile/${usuarioId}/condiciones-salud`,
      data
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new NotFoundException('Cliente no encontrado');
    }
    throw error;
  }
}
}