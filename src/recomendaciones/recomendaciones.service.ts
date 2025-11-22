
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RecomendacionesService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async getRecomendacionesPorCarrito(usuarioId: number) {
    try {
      console.log(' Obteniendo recomendaciones para usuario:', usuarioId);
      
      const response = await axios.get(
        `${this.pythonApiUrl}/recomendaciones/por-carrito/${usuarioId}`
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo recomendaciones:', error.response?.data || error.message);
      throw error;
    }
  }

  async getRecomendacionesPorPedido(pedidoId: number) {
    try {
      console.log(' Obteniendo recomendaciones para pedido:', pedidoId);
      
      const response = await axios.get(
        `${this.pythonApiUrl}/recomendaciones/por-pedido/${pedidoId}`
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo recomendaciones:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCategorias() {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/recomendaciones/categorias`
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo categorías:', error.response?.data || error.message);
      throw error;
    }
  }
}