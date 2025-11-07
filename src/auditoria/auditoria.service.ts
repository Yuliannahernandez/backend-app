import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria, AccionAuditoria } from '../entities/auditoria.entity';

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
  constructor(
    @InjectRepository(Auditoria)
    private auditoriaRepository: Repository<Auditoria>,
  ) {}

  // ==================== CREAR REGISTRO DE AUDITORÍA ====================
  async create(data: CreateAuditoriaDto): Promise<Auditoria> {
    try {
      const auditoria = this.auditoriaRepository.create(data);
      return await this.auditoriaRepository.save(auditoria);
    } catch (error) {
      console.error('Error al crear auditoría:', error);
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
    const query = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .leftJoinAndSelect('auditoria.usuario', 'usuario')
      .leftJoinAndSelect('usuario.cliente', 'cliente')
      .orderBy('auditoria.fecha', 'DESC');

    if (filters?.usuarioId) {
      query.andWhere('auditoria.usuarioId = :usuarioId', { usuarioId: filters.usuarioId });
    }

    if (filters?.tabla) {
      query.andWhere('auditoria.tabla = :tabla', { tabla: filters.tabla });
    }

    if (filters?.accion) {
      query.andWhere('auditoria.accion = :accion', { accion: filters.accion });
    }

    if (filters?.fechaDesde) {
      query.andWhere('auditoria.fecha >= :fechaDesde', { fechaDesde: filters.fechaDesde });
    }

    if (filters?.fechaHasta) {
      query.andWhere('auditoria.fecha <= :fechaHasta', { fechaHasta: filters.fechaHasta });
    }

    if (filters?.limit) {
      query.take(filters.limit);
    }

    if (filters?.offset) {
      query.skip(filters.offset);
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      limit: filters?.limit,
      offset: filters?.offset,
    };
  }

  // ==================== OBTENER AUDITORÍA POR ID ====================
  async findOne(id: number) {
    return await this.auditoriaRepository.findOne({
      where: { id },
      relations: ['usuario', 'usuario.cliente'],
    });
  }

  // ==================== OBTENER HISTORIAL DE UN REGISTRO ====================
  async getHistorialRegistro(tabla: string, registroId: number) {
    return await this.auditoriaRepository.find({
      where: { tabla, registroId },
      relations: ['usuario', 'usuario.cliente'],
      order: { fecha: 'DESC' },
    });
  }

  // ==================== ESTADÍSTICAS ====================
  async getEstadisticas(usuarioId?: number) {
    const query = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.accion', 'accion')
      .addSelect('COUNT(*)', 'total')
      .groupBy('auditoria.accion');

    if (usuarioId) {
      query.where('auditoria.usuarioId = :usuarioId', { usuarioId });
    }

    const resultados = await query.getRawMany();

    return {
      totalInserts: Number(resultados.find(r => r.accion === 'insert')?.total || 0),
      totalUpdates: Number(resultados.find(r => r.accion === 'update')?.total || 0),
      totalDeletes: Number(resultados.find(r => r.accion === 'delete')?.total || 0),
      totalSelects: Number(resultados.find(r => r.accion === 'select')?.total || 0),
      total: resultados.reduce((sum, r) => sum + Number(r.total), 0),
    };
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

    camposSensibles.forEach(campo => {
      if (sanitized[campo]) {
        sanitized[campo] = '***OCULTO***';
      }
    });

    return sanitized;
  }
}