
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TarjetasService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async validarTarjeta(body: any) {
    try {
      const response = await axios.post(
        `${this.pythonApiUrl}/tarjetas/validar`,
        body
      );
      return response.data;
    } catch (error) {
      console.error('Error validando tarjeta:', error.response?.data || error.message);
      throw error;
    }
  }

  async procesarPago(usuarioId: number, body: any) {
    try {
      console.log('Procesando pago con tarjeta:', { usuarioId, monto: body.monto });
      
      const response = await axios.post(
        `${this.pythonApiUrl}/tarjetas/procesar-pago`,
        body,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error procesando pago:', error.response?.data || error.message);
      throw error;
    }
  }

  async getTarjetasPrueba() {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/tarjetas/tarjetas-prueba`
      );
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo tarjetas de prueba:', error.response?.data || error.message);
      throw error;
    }
  }
}