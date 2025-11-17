import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ActualizarProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoriaId?: number;
  imagenPrincipal?: string;
  disponible?: boolean;
  stock?: number;
  tiempoPreparacion?: number;
  esNuevo?: boolean;
  enTendencia?: boolean;
}

export interface CrearProductoDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  imagenPrincipal?: string;
  disponible?: boolean;
  stock?: number;
  tiempoPreparacion?: number;
}

@Injectable()
export class GerenteService {
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

  // ==================== GESTIÓN DE PRODUCTOS ====================

  async getProductosGestion() {
    try {
      const response = await this.apiClient.get('/productos');
      const productos = response.data;

      return productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        categoria: p.categoriaNombre,
        categoriaId: p.categoriaId,
        disponible: p.disponible,
        stock: p.stock,
        esNuevo: p.esNuevo,
        enTendencia: p.enTendencia,
        imagenPrincipal: p.imagenPrincipal,
        tiempoPreparacion: p.tiempoPreparacion,
      }));
    } catch (error) {
      throw error;
    }
  }

  async crearProducto(data: CrearProductoDto) {
    try {
      // Verificar que la categoría existe
      await this.apiClient.get(`/categorias/${data.categoriaId}`);

      const response = await this.apiClient.post('/productos', {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        categoriaId: data.categoriaId,
        imagenPrincipal: data.imagenPrincipal,
        disponible: data.disponible ?? true,
        tiempoPreparacion: data.tiempoPreparacion ?? 15,
        esNuevo: false,
        enTendencia: false,
      });

      return {
        id: response.data.id,
        nombre: response.data.nombre,
        mensaje: 'Producto creado exitosamente',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }

  async actualizarProducto(id: number, data: ActualizarProductoDto) {
    try {
      // Si se cambia la categoría, verificar que existe
      if (data.categoriaId) {
        await this.apiClient.get(`/categorias/${data.categoriaId}`);
      }

      await this.apiClient.put(`/productos/${id}`, data);

      return {
        id,
        mensaje: 'Producto actualizado exitosamente',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto o categoría no encontrada');
      }
      throw error;
    }
  }

  async toggleDisponibilidad(id: number) {
    try {
      // Obtener producto actual
      const response = await this.apiClient.get(`/productos/${id}`);
      const producto = response.data;

      // Cambiar disponibilidad
      const nuevoEstado = !producto.disponible;
      await this.apiClient.put(`/productos/${id}`, {
        disponible: nuevoEstado,
      });

      return {
        id,
        disponible: nuevoEstado,
        mensaje: `Producto ${nuevoEstado ? 'activado' : 'desactivado'}`,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto no encontrado');
      }
      throw error;
    }
  }

  async eliminarProducto(id: number) {
    try {
      await this.apiClient.delete(`/productos/${id}`);
      return {
        mensaje: 'Producto eliminado exitosamente',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto no encontrado');
      }
      throw error;
    }
  }

  // ==================== GESTIÓN DE PEDIDOS ====================

  async getPedidosActivos() {
    try {
      const response = await this.apiClient.get('/pedidos/activos');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async cambiarEstadoPedido(pedidoId: number, nuevoEstado: string) {
    const estadosValidos = [
      'confirmado',
      'en_preparacion',
      'listo',
      'completado',
      'cancelado',
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }

    try {
      const response = await this.apiClient.put(`/pedidos/${pedidoId}/estado`, null, {
        params: { estado: nuevoEstado },
      });

      return {
        id: pedidoId,
        estado: nuevoEstado,
        mensaje: `Pedido actualizado a: ${nuevoEstado}`,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(
          error.response.data.detail || 'No se puede cambiar el estado de este pedido'
        );
      }
      throw error;
    }
  }

  // ==================== REPORTES Y MÉTRICAS ====================

  async getReporteVentas(fechaInicio?: string, fechaFin?: string) {
    try {
      const params: any = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const response = await this.apiClient.get('/reportes/ventas', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMetricasGenerales() {
    try {
      const response = await this.apiClient.get('/reportes/metricas');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}