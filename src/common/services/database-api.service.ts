// ============================================================
// src/common/services/database-api.service.ts
// Servicio para consumir la API Python
// ============================================================
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class DatabaseApiService {
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('PYTHON_API_URL', 'http://localhost:8000');
  }

  private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    try {
      const config = { method, url: `${this.apiUrl}${endpoint}`, data };
      const response = await firstValueFrom(this.httpService.request<T>(config));
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new HttpException(
        axiosError.response?.data || 'Error en API de base de datos',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============= USUARIOS =============
  async findAllUsuarios() {
    return this.request('GET', '/usuarios');
  }

  async findUsuarioById(id: number) {
    return this.request('GET', `/usuarios/${id}`);
  }

  async findUsuarioByEmail(email: string) {
    return this.request('GET', `/usuarios/email/${email}`);
  }

  async createUsuario(data: any) {
    return this.request('POST', '/usuarios', data);
  }

  async updateUsuario(id: number, data: any) {
    return this.request('PUT', `/usuarios/${id}`, data);
  }

  // ============= PRODUCTOS =============
  async findAllProductos() {
    return this.request('GET', '/productos');
  }

  async findProductoById(id: number) {
    return this.request('GET', `/productos/${id}`);
  }

  async createProducto(data: any) {
    return this.request('POST', '/productos', data);
  }

  async updateProducto(id: number, data: any) {
    return this.request('PUT', `/productos/${id}`, data);
  }

  async deleteProducto(id: number) {
    return this.request('DELETE', `/productos/${id}`);
  }

  // ============= CARRITO =============
  async findCarritoByUsuarioId(usuarioId: number) {
    return this.request('GET', `/carrito/usuario/${usuarioId}`);
  }

  async createCarrito(usuarioId: number) {
    return this.request('POST', `/carrito?usuario_id=${usuarioId}`, {});
  }

  async addCarritoItem(data: { carritoId: number; productoId: number; cantidad: number }) {
    return this.request('POST', '/carrito/items', data);
  }

  async deleteCarritoItem(id: number) {
    return this.request('DELETE', `/carrito/items/${id}`);
  }

  async vaciarCarrito(carritoId: number) {
    return this.request('DELETE', `/carrito/vaciar/${carritoId}`);
  }

  // ============= PEDIDOS =============
  async findPedidosByUsuarioId(usuarioId: number) {
    return this.request('GET', `/pedidos/usuario/${usuarioId}`);
  }

  async findPedidoById(id: number) {
    return this.request('GET', `/pedidos/${id}`);
  }

  async findPedidoItems(id: number) {
    return this.request('GET', `/pedidos/${id}/items`);
  }

  async createPedido(data: any) {
    return this.request('POST', '/pedidos', data);
  }

  async addPedidoItems(pedidoId: number, items: any[]) {
    return this.request('POST', `/pedidos/${pedidoId}/items`, items);
  }

  // ============= CATEGORÍAS =============
  async findAllCategorias() {
    return this.request('GET', '/categorias');
  }

  async findCategoriaById(id: number) {
    return this.request('GET', `/categorias/${id}`);
  }

  // ============= SUCURSALES =============
  async findAllSucursales() {
    return this.request('GET', '/sucursales');
  }

  async findSucursalById(id: number) {
    return this.request('GET', `/sucursales/${id}`);
  }

  // ============= CUPONES =============
  async findAllCupones() {
    return this.request('GET', '/cupones');
  }

  async findCuponByCodigo(codigo: string) {
    return this.request('GET', `/cupones/codigo/${codigo}`);
  }

  // ============= LEALTAD =============
  async findLealtadByUsuarioId(usuarioId: number) {
    return this.request('GET', `/lealtad/usuario/${usuarioId}`);
  }

  async updatePuntosLealtad(usuarioId: number, puntos: number) {
    return this.request('PUT', `/lealtad/usuario/${usuarioId}/puntos?puntos=${puntos}`, {});
  }

  // ============= AUDITORÍA =============
  async createAuditoria(data: any) {
    return this.request('POST', '/auditoria', data);
  }
}
