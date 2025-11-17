import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccionAuditoria } from '../entities/auditoria.entity';
import axios, { AxiosInstance } from 'axios';

export interface CreateAuditoriaDto {
  usuarioId: number;
  tabla: string;
  accion: AccionAuditoria;
  registroId: number;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  descripcion?: string;
  endpoint?: string;
  metodo?: string;
}

@Injectable()
export class AuditoriaService {
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

  // ==================== CREAR REGISTRO DE AUDITORÍA ====================
  async create(data: CreateAuditoriaDto): Promise<any> {
    try {
      const payload = {
        usuarioId: data.usuarioId,
        tabla: data.tabla,
        accion: data.accion,
        registroId: data.registroId || 0,
        datosAnteriores: data.datosAnteriores ? JSON.stringify(this.sanitizeData(data.datosAnteriores)) : null,
        datosNuevos: data.datosNuevos ? JSON.stringify(this.sanitizeData(data.datosNuevos)) : null,
        ipAddress: data.ipAddress,
        descripcion: data.descripcion,
        endpoint: data.endpoint,
        metodo: data.metodo,
      };

      const response = await this.apiClient.post('/auditoria', payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear auditoría:', error.message);
      // No lanzar error para no interrumpir la operación principal
      return null;
    }
  }

  // ==================== REGISTRAR INSERT ====================
  async logInsert(
    usuarioId: number,
    tabla: string,
    registroId: number,
    datosNuevos: any,
    ipAddress?: string,
    endpoint?: string,
  ): Promise<void> {
    await this.create({
      usuarioId,
      tabla,
      accion: AccionAuditoria.INSERT,
      registroId,
      datosNuevos: this.sanitizeData(datosNuevos),
      ipAddress,
      descripcion: `Nuevo registro creado en ${tabla}`,
      endpoint,
      metodo: 'POST',
    });
  }

  // ==================== REGISTRAR UPDATE ====================
  async logUpdate(
    usuarioId: number,
    tabla: string,
    registroId: number,
    datosAnteriores: any,
    datosNuevos: any,
    ipAddress?: string,
    endpoint?: string,
  ): Promise<void> {
    await this.create({
      usuarioId,
      tabla,
      accion: AccionAuditoria.UPDATE,
      registroId,
      datosAnteriores: this.sanitizeData(datosAnteriores),
      datosNuevos: this.sanitizeData(datosNuevos),
      ipAddress,
      descripcion: `Registro actualizado en ${tabla}`,
      endpoint,
      metodo: 'PUT',
    });
  }

  // ==================== REGISTRAR DELETE ====================
  async logDelete(
    usuarioId: number,
    tabla: string,
    registroId: number,
    datosAnteriores: any,
    ipAddress?: string,
    endpoint?: string,
  ): Promise<void> {
    await this.create({
      usuarioId,
      tabla,
      accion: AccionAuditoria.DELETE,
      registroId,
      datosAnteriores: this.sanitizeData(datosAnteriores),
      ipAddress,
      descripcion: `Registro eliminado de ${tabla}`,
      endpoint,
      metodo: 'DELETE',
    });
  }

  // ==================== REGISTRAR SELECT ====================
  async logSelect(
    usuarioId: number,
    tabla: string,
    ipAddress?: string,
    endpoint?: string,
    descripcion?: string,
  ): Promise<void> {
    await this.create({
      usuarioId,
      tabla,
      accion: AccionAuditoria.SELECT,
      registroId: 0, // No aplica para SELECT
      ipAddress,
      descripcion: descripcion || `Consulta realizada en ${tabla}`,
      endpoint,
      metodo: 'GET',
    });
  }

  // ==================== OBTENER AUDITORÍAS ====================
  async findAll(filters?: {
    usuarioId?: number;
    tabla?: string;
    accion?: AccionAuditoria;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const params: any = {};

      if (filters?.usuarioId) params.usuarioId = filters.usuarioId;
      if (filters?.tabla) params.tabla = filters.tabla;
      if (filters?.accion) params.accion = filters.accion;
      if (filters?.fechaDesde) params.fechaDesde = filters.fechaDesde.toISOString();
      if (filters?.fechaHasta) params.fechaHasta = filters.fechaHasta.toISOString();
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await this.apiClient.get('/auditoria', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo auditorías:', error.message);
      return { items: [], total: 0 };
    }
  }

  // ==================== OBTENER AUDITORÍA POR ID ====================
  async findOne(id: number) {
    try {
      const response = await this.apiClient.get(`/auditoria/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo auditoría:', error.message);
      return null;
    }
  }

  // ==================== OBTENER HISTORIAL DE UN REGISTRO ====================
  async getHistorialRegistro(tabla: string, registroId: number) {
    try {
      const response = await this.apiClient.get(`/auditoria/historial/${tabla}/${registroId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error.message);
      return [];
    }
  }

  // ==================== ESTADÍSTICAS ====================
  async getEstadisticas(usuarioId?: number) {
    try {
      const params = usuarioId ? { usuarioId } : {};
      const response = await this.apiClient.get('/auditoria/estadisticas/general', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error.message);
      return {
        totalInserts: 0,
        totalUpdates: 0,
        totalDeletes: 0,
        totalSelects: 0,
        total: 0,
      };
    }
  }

  // ==================== LIMPIAR DATOS SENSIBLES ====================
  private sanitizeData(data: any): any {
    if (!data) return null;

    const sanitized = { ...data };

    // Eliminar campos sensibles
    const camposSensibles = [
      'password',
      'passwordHash',
      'password_hash',
      'token',
      'tokenRecuperacion',
      'verificationToken',
      'twoFASecret',
      'two_fa_secret',
    ];

    camposSensibles.forEach((campo) => {
      if (sanitized[campo]) {
        sanitized[campo] = '***OCULTO***';
      }
    });

    return sanitized;
  }
}