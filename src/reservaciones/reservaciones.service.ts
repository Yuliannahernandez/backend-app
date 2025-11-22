
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ReservacionesService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async getDisponibilidad(sucursalId: number, fecha: string) {
    try {
      console.log(' Consultando disponibilidad:', { sucursalId, fecha });
      
      const response = await axios.get(
        `${this.pythonApiUrl}/reservaciones/disponibilidad`,
        {
          params: {
            sucursal_id: sucursalId,
            fecha: fecha
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo disponibilidad:', error.response?.data || error.message);
      throw error;
    }
  }

  async crearReservacion(usuarioId: number, body: any) {
    try {
      console.log(' Creando reservación:', { usuarioId, body });
      
      const response = await axios.post(
        `${this.pythonApiUrl}/reservaciones/crear`,
        body,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error creando reservación:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMisReservaciones(usuarioId: number) {
    try {
      console.log(' Obteniendo reservaciones para usuario:', usuarioId);
      
      const response = await axios.get(
        `${this.pythonApiUrl}/reservaciones/mis-reservaciones`,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo reservaciones:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSucursalesDisponibles() {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/reservaciones/sucursales/disponibles`
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo sucursales:', error.response?.data || error.message);
      throw error;
    }
  }

  async getDetalleReservacion(usuarioId: number, reservacionId: number) {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/reservaciones/${reservacionId}`,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo detalle:', error.response?.data || error.message);
      throw error;
    }
  }

  async cancelarReservacion(usuarioId: number, reservacionId: number) {
    try {
      console.log(' Cancelando reservación:', reservacionId);
      
      const response = await axios.delete(
        `${this.pythonApiUrl}/reservaciones/${reservacionId}/cancelar`,
        {
          headers: {
            'usuario-id': usuarioId.toString()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(' Error cancelando reservación:', error.response?.data || error.message);
      throw error;
    }
  }
}