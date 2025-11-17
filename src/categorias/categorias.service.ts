import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CategoriasService {
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

  async getCategorias() {
    try {
      const response = await this.apiClient.get('/categorias');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  async getCategoria(id: number) {
    try {
      const response = await this.apiClient.get(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }

  async getProductosPorCategoria(categoriaId: number) {
    try {
      // Verificar que la categoría existe
      const categoria = await this.getCategoria(categoriaId);

      // Obtener productos de la categoría
      const response = await this.apiClient.get(`/categorias/${categoriaId}/productos`);
      const productos = response.data;

      return {
        categoria,
        productos,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }

  async getCategoriaConProductos(categoriaId: number) {
    try {
      const resultado = await this.getProductosPorCategoria(categoriaId);
      
      return {
        ...resultado.categoria,
        total_productos: resultado.productos.length,
        productos: resultado.productos,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCategoriasConProductos() {
    try {
      const categorias = await this.getCategorias();
      const productosResponse = await this.apiClient.get('/productos');
      const todosProductos = productosResponse.data;

      return categorias.map(categoria => {
        const productosCategoria = todosProductos
          .filter(p => p.categoria_id === categoria.id && p.disponible === true)
          .sort((a, b) => {
            if (b.en_tendencia !== a.en_tendencia) {
              return b.en_tendencia - a.en_tendencia;
            }
            if (b.es_nuevo !== a.es_nuevo) {
              return b.es_nuevo - a.es_nuevo;
            }
            return a.nombre.localeCompare(b.nombre);
          });

        return {
          ...categoria,
          total_productos: productosCategoria.length,
          productos: productosCategoria,
        };
      });
    } catch (error) {
      throw error;
    }
  }
}