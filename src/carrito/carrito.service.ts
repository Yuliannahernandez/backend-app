import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CarritoService {
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

  async getCarrito(usuarioId: number) {
    try {
      console.log(' NestJS: Obteniendo carrito para usuario:', usuarioId);
      
      
      const response = await this.apiClient.get(`/carrito/usuario/${usuarioId}`);
      const carrito = response.data;

      console.log(' NestJS: Carrito recibido:', carrito);

      
      return {
        id: carrito.id,
        tipoEntrega: carrito.tipo_entrega || 'recoger_tienda',
        productos: carrito.productos || [],
        subtotal: carrito.subtotal || 0,
        descuento: carrito.descuento || 0,
        costoEnvio: carrito.costoEnvio || 0,
        total: carrito.total || 0,
        tiempoEstimado: carrito.tiempoEstimado || 15,
        sucursal: carrito.sucursal || null, 
        sucursal_id: carrito.sucursal_id || null
      };
    } catch (error) {
      console.error(' NestJS: Error obteniendo carrito:', error.response?.data);
      
      if (error.response?.status === 404) {
        // Devolver carrito vacío
        return {
          id: null,
          tipoEntrega: 'recoger_tienda',
          productos: [],
          subtotal: 0,
          descuento: 0,
          costoEnvio: 0,
          total: 0,
          tiempoEstimado: 15,
          sucursal: null,
          sucursal_id: null
        };
      }
      throw error;
    }
  }



async agregarProducto(usuarioId: number, productoId: number, cantidad: number) {
  try {
    console.log(` NestJS: Agregando producto ${productoId} (cant: ${cantidad}) para usuario ${usuarioId}`);
    
  
    const response = await this.apiClient.post(
      `/carrito/usuario/${usuarioId}/agregar`,
      {
        producto_id: productoId, 
        cantidad: cantidad
      }
     
    );
    
    console.log(' NestJS: Producto agregado');
    
    return this.getCarrito(usuarioId);
  } catch (error) {
    console.error(' NestJS: Error agregando producto:', error.response?.data);
    
    if (error.response?.status === 404) {
      throw new NotFoundException(error.response?.data?.detail || 'Producto no encontrado');
    }
    if (error.response?.status === 400) {
      throw new BadRequestException(error.response?.data?.detail || 'Producto no disponible');
    }
    throw error;
  }
}
  async actualizarCantidad(usuarioId: number, detalleId: number, cantidad: number) {
    if (cantidad < 1) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    try {
      const response = await this.apiClient.put(
        `/carrito/usuario/${usuarioId}/detalle/${detalleId}`,
        { cantidad }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto no encontrado en el carrito');
      }
      throw error;
    }
  }

  async eliminarProducto(usuarioId: number, detalleId: number) {
    try {
      const response = await this.apiClient.delete(
        `/carrito/usuario/${usuarioId}/detalle/${detalleId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto no encontrado en el carrito');
      }
      throw error;
    }
  }

  async cambiarTipoEntrega(usuarioId: number, tipoEntrega: 'domicilio' | 'recoger_tienda') {
    const carrito = await this.getCarrito(usuarioId);

    if (!carrito.id) {
      throw new NotFoundException('Carrito no encontrado');
    }

    try {
      const response = await this.apiClient.put(`/carrito/usuario/${usuarioId}/tipo-entrega`, {
        tipo_entrega: tipoEntrega
      });
      return response.data;
    } catch (error) {
      throw new BadRequestException('Error al cambiar tipo de entrega');
    }
  }

  async vaciarCarrito(usuarioId: number) {
    const carrito = await this.getCarrito(usuarioId);

    if (!carrito.id) {
      return this.getCarrito(usuarioId);
    }

    try {
      const response = await this.apiClient.delete(`/carrito/usuario/${usuarioId}/vaciar`);
      return response.data;
    } catch (error) {
      throw new BadRequestException('Error al vaciar carrito');
    }
  }

  async seleccionarMetodoPago(usuarioId: number, metodoPagoId: string | number) {
    const carrito = await this.getCarrito(usuarioId);

    if (!carrito.id) {
      throw new NotFoundException('Carrito no encontrado');
    }

    try {
      const metodoPago = metodoPagoId === 'efectivo' ? null : Number(metodoPagoId);
      
      const response = await this.apiClient.put(`/pedidos/${carrito.id}/metodopago`, {
        metodo_pago_id: metodoPago
      });
      
      return this.getCarrito(usuarioId);
    } catch (error) {
      throw new BadRequestException('Error al seleccionar método de pago');
    }
  }

  async seleccionarSucursal(usuarioId: number, sucursalId: number) {
    const carrito = await this.getCarrito(usuarioId);

    if (!carrito.id) {
      throw new NotFoundException('Carrito no encontrado');
    }

    try {
      console.log(` NestJS: Actualizando pedido ${carrito.id} con sucursal ${sucursalId}`);

      const response = await this.apiClient.put(`/pedidos/${carrito.id}?sucursalId=${sucursalId}`);
      
      console.log('NestJS: Sucursal actualizada:', response.data);
      
      return this.getCarrito(usuarioId);
    } catch (error) {
      console.error(' NestJS: Error al seleccionar sucursal:', error.response?.data);
      throw new BadRequestException('Error al seleccionar sucursal');
    }
  }
}