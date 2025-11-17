import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LealtadService } from '../lealtad/lealtad.service';

@Injectable()
export class PedidosService {
  private apiClient: AxiosInstance;

  constructor(
    private configService: ConfigService,
    private lealtadService: LealtadService,
  ) {
    this.apiClient = axios.create({
      baseURL: this.configService.get('PYTHON_API_URL') || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

   async actualizarSucursal(pedidoId: number, sucursalId: number) {
    try {
      console.log(` NestJS: Enviando a Python - Pedido ${pedidoId}, Sucursal ${sucursalId}`);
      
      const response = await this.apiClient.put(
        `/pedidos/${pedidoId}?sucursalId=${sucursalId}`
      );
      
      console.log(' NestJS: Respuesta de Python:', response.data);
      return response.data;
    } catch (error) {
      console.error(' NestJS: Error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new NotFoundException('Pedido o sucursal no encontrado');
      }
      throw error;
    }
  }

  async crearPedidoDesdeCarrito(usuarioId: number) {
    console.log('Creando pedido desde carrito para usuario:', usuarioId);

    try {
      const response = await this.apiClient.post('/pedidos/crear-desde-carrito', {
        usuario_id: usuarioId,
      });

      const pedido = response.data;
      console.log('Pedido creado con ID:', pedido.id);

      // AGREGAR PUNTOS DE LEALTAD
      try {
        const puntosGanados = await this.lealtadService.agregarPuntosPorCompra(
          usuarioId,
          pedido.total,
          pedido.id
        );
        console.log(` Puntos agregados: ${puntosGanados}`);
      } catch (error) {
        console.error(' Error agregando puntos:', error);
        // No lanzamos el error para que el pedido se complete aunque falle los puntos
      }

      // Retornar el pedido completo
      return this.getPedido(usuarioId, pedido.id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Recurso no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'Error creando pedido');
      }
      throw error;
    }
  }

async getPedido(usuarioId: number, pedidoId: number) {
  try {
    console.log(` NestJS: Obteniendo pedido ${pedidoId}`);
    
    // No enviar usuario_id, solo el pedido_id en la URL
    const response = await this.apiClient.get(`/pedidos/${pedidoId}/detalle`);
    
    console.log(' NestJS: Pedido obtenido');
    return response.data;
  } catch (error) {
    console.error(' NestJS: Error obteniendo pedido:', error.response?.data);
    if (error.response?.status === 404) {
      throw new NotFoundException('Pedido no encontrado');
    }
    throw error;
  }
}

  async getMisPedidos(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/pedidos/usuario/${usuarioId}`);
      
      // Filtrar solo pedidos que no sean carritos
      return response.data
        .filter(p => p.estado !== 'carrito')
        .map(pedido => ({
          id: pedido.id,
          estado: pedido.estado,
          total: pedido.total,
          cantidadProductos: pedido.cantidadProductos || 0,
          sucursal: pedido.sucursalNombre,
          fechaCreacion: pedido.fechaCreacion,
        }));
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async cancelarPedido(usuarioId: number, pedidoId: number) {
    try {
      const response = await this.apiClient.put(`/pedidos/${pedidoId}/cancelar`, {
        usuarioId,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'No se puede cancelar este pedido');
      }
      throw error;
    }
  }
}