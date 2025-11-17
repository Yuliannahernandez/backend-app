import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TriviaService {
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

  async iniciarPartida(usuarioId: number, pedidoId?: number) {
    try {
      const response = await this.apiClient.post('/trivia/iniciar', {
        usuarioId,
        pedidoId: pedidoId || null,
      });

      console.log('🎮 Partida creada:', response.data.id);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async obtenerPreguntaSiguiente(usuarioId: number, partidaId: number) {
    try {
      const response = await this.apiClient.get(`/trivia/partida/${partidaId}/siguiente-pregunta`, {
        params: { usuarioId },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Recurso no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'La partida ya ha finalizado');
      }
      throw error;
    }
  }

  async responderPregunta(
    usuarioId: number,
    partidaId: number,
    preguntaId: number,
    respuestaId: number,
    tiempoRespuesta: number,
  ) {
    console.log('Parámetros recibidos:', {
      usuarioId,
      partidaId,
      preguntaId,
      respuestaId,
      tiempoRespuesta,
    });

    try {
      const response = await this.apiClient.post('/trivia/responder', {
        usuarioId,
        partidaId,
        preguntaId,
        respuestaId,
        tiempoRespuesta,
      });

      const { esCorrecta, puntosGanados } = response.data;
      console.log(`${esCorrecta ? '✅' : '❌'} Respuesta ${esCorrecta ? 'correcta' : 'incorrecta'} - Puntos: ${puntosGanados}`);

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data.detail || 'Recurso no encontrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.detail || 'Error al guardar la respuesta');
      }
      throw error;
    }
  }

  async finalizarPartida(usuarioId: number, partidaId: number) {
    try {
      const response = await this.apiClient.post('/trivia/finalizar', {
        usuarioId,
        partidaId,
      });

      console.log('Partida finalizada - Correctas:', response.data.correctas);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Partida no encontrada');
      }
      throw error;
    }
  }

  async obtenerHistorial(usuarioId: number) {
    try {
      const response = await this.apiClient.get(`/trivia/historial/${usuarioId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }
}