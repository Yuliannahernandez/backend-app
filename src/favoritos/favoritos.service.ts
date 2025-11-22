
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FavoritosService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async getMisFavoritos(usuarioId: number) {
    try {
      console.log(' Obteniendo favoritos para usuario:', usuarioId);
      
      const response = await axios.get(
        `${this.pythonApiUrl}/favoritos/mis-favoritos`,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error obteniendo favoritos:', error.response?.data || error.message);
      throw error;
    }
  }

  async toggleFavorito(usuarioId: number, productoId: number) {
    try {
      console.log(' Toggle favorito - Usuario:', usuarioId, 'Producto:', productoId);
      
      const response = await axios.post(
        `${this.pythonApiUrl}/favoritos/toggle/${productoId}`,
        {},
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error en toggle favorito:', error.response?.data || error.message);
      throw error;
    }
  }

  async esFavorito(usuarioId: number, productoId: number) {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/favoritos/es-favorito/${productoId}`,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error verificando favorito:', error.response?.data || error.message);
      return { esFavorito: false };
    }
  }
}