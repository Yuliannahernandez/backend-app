import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductosService {
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('PYTHON_API_URL') || 'http://localhost:8000';
  }

  async getProductos(categoriaId?: number) {
    try {
      const url = categoriaId 
        ? `${this.apiUrl}/categorias/${categoriaId}/productos`
        : `${this.apiUrl}/productos`;
      
      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      console.log('Productos recibidos:', response.data.length);
      
      
      return response.data;
    } catch (error) {
      console.error(' Error FastAPI ->', error.message);
      throw new HttpException(
        'Error al obtener productos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductosNuevos() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/productos`)
      );

      const productosNuevos = response.data
        .filter((p: any) => p.es_nuevo && p.disponible)
        .slice(0, 10);

      console.log('Productos nuevos:', productosNuevos.length);
      return productosNuevos;
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos nuevos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductosTendencia() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/productos`)
      );

      const productosTendencia = response.data
        .filter((p: any) => p.en_tendencia && p.disponible)
        .slice(0, 10);

      console.log('Productos en tendencia:', productosTendencia.length);
      return productosTendencia;
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos en tendencia',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductoDestacado() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/productos`)
      );

      const destacado = response.data.find(
        (p: any) => p.disponible && p.en_tendencia
      );

      return destacado || null;
    } catch (error) {
      throw new HttpException(
        'Error al obtener producto destacado',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCategorias() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/categorias`)
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener categorías',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductoDetalle(id: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/productos/${id}/detalle`)
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Producto no encontrado');
      }
      throw new HttpException(
        'Error al obtener detalle del producto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}