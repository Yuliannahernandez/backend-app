import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccionAuditoria } from '../entities/auditoria.entity';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  // ==================== OBTENER TODAS LAS AUDITORÍAS (SOLO ADMIN) ====================
  @Get()
  @Roles('admin')
  async findAll(
    @Query('usuarioId') usuarioId?: number,
    @Query('tabla') tabla?: string,
    @Query('accion') accion?: AccionAuditoria,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.auditoriaService.findAll({
      usuarioId,
      tabla,
      accion,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  // ==================== OBTENER MIS AUDITORÍAS (CLIENTE) ====================
  @Get('mis-actividades')
  async getMisActividades(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.auditoriaService.findAll({
      usuarioId: req.user.sub,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  // ==================== OBTENER AUDITORÍA POR ID ====================
  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.auditoriaService.findOne(id);
  }

  // ==================== OBTENER HISTORIAL DE UN REGISTRO ====================
  @Get('historial/:tabla/:registroId')
  @Roles('admin')
  async getHistorial(
    @Param('tabla') tabla: string,
    @Param('registroId', ParseIntPipe) registroId: number,
  ) {
    return await this.auditoriaService.getHistorialRegistro(tabla, registroId);
  }

  // ==================== ESTADÍSTICAS GENERALES (ADMIN) ====================
  @Get('estadisticas/generales')
  @Roles('admin')
  async getEstadisticas() {
    return await this.auditoriaService.getEstadisticas();
  }

  // ==================== MIS ESTADÍSTICAS (CLIENTE) ====================
  @Get('estadisticas/mis-actividades')
  async getMisEstadisticas(@Request() req) {
    return await this.auditoriaService.getEstadisticas(req.user.sub);
  }
}