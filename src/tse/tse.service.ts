
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TseService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async validarCedula(numeroCedula: string) {
    try {
      console.log('🇨🇷 Validando cédula en TSE:', numeroCedula);
      
      const response = await axios.post(
        `${this.pythonApiUrl}/tse/validar-cedula`,
        { numero_cedula: numeroCedula }
      );

      console.log(' Respuesta TSE:', response.data.valida ? 'Válida' : 'Inválida');
      return response.data;
    } catch (error) {
      console.error(' Error validando cédula:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCedulasPrueba() {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/tse/cedulas-prueba`
      );
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo cédulas de prueba:', error.response?.data || error.message);
      throw error;
    }
  }
}