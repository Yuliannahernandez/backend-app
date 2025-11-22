
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SinpeService {
  private readonly pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  async getMiCuenta(usuarioId: number) {
    try {
      console.log('Obteniendo cuenta para usuario:', usuarioId);
      
      const response = await axios.get(`${this.pythonApiUrl}/sinpe/mi-cuenta`, {
        headers: {
          'usuario-id': usuarioId.toString()
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error obteniendo cuenta:', error.response?.data || error.message);
      throw error;
    }
  }


async iniciarTransferencia(data: any) {
  try {
    console.log('Iniciando transferencia SINPE - Data recibida:', data);
    

    const payload = {
      telefono_origen: data.telefonoOrigen || data.telefono_origen,
      telefono_destino: data.telefonoDestino || data.telefono_destino,
      monto: data.monto,
      descripcion: data.descripcion || 'Pago pedido restaurante'
    };
    
    console.log(' Payload para Python:', payload);
    
    const response = await axios.post(
      `${this.pythonApiUrl}/sinpe/iniciar-transferencia`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(' Error iniciando transferencia:', error.response?.data || error.message);
    throw error;
  }
}

async verificarCodigo(data: any) {
  try {
    console.log(' Verificando código - Data recibida:', data);
    
    const payload = {
      transaccion_id: data.transaccionId || data.transaccion_id,
      codigo: data.codigo
    };
    
    console.log(' Payload para Python:', payload);
    
    const response = await axios.post(
      `${this.pythonApiUrl}/sinpe/verificar-codigo`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(' Error verificando código:', error.response?.data || error.message);
    throw error;
  }
}

  

  async getMisTransacciones(usuarioId: number) {
    try {
      const response = await axios.get(`${this.pythonApiUrl}/sinpe/transacciones`, {
        headers: {
          'usuario-id': usuarioId.toString()
        }
      });

      return response.data;
    } catch (error) {
      console.error(' Error obteniendo transacciones:', error.response?.data || error.message);
      throw error;
    }
  }
}