import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AccionAuditoria } from '../entities/auditoria.entity';
import { Reflector } from '@nestjs/core';

// Decorador para marcar endpoints que requieren auditoría
export const AUDITORIA_KEY = 'auditoria';
export interface AuditoriaMetadata {
  tabla: string;
  accion?: AccionAuditoria;
  descripcion?: string;
}

export const Auditar = (metadata: AuditoriaMetadata) =>
  Reflect.metadata(AUDITORIA_KEY, metadata);

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const metadata = this.reflector.get<AuditoriaMetadata>(
      AUDITORIA_KEY,
      context.getHandler(),
    );

    // Si no hay metadata de auditoría, continuar sin auditar
    if (!metadata) {
      return next.handle();
    }

    const usuario = request.user;
    const ipAddress = this.getClientIp(request);
    const endpoint = request.url;
    const metodo = request.method;

    // Determinar la acción basada en el método HTTP si no está especificada
    let accion = metadata.accion;
    if (!accion) {
      switch (metodo) {
        case 'POST':
          accion = AccionAuditoria.INSERT;
          break;
        case 'PUT':
        case 'PATCH':
          accion = AccionAuditoria.UPDATE;
          break;
        case 'DELETE':
          accion = AccionAuditoria.DELETE;
          break;
        case 'GET':
          accion = AccionAuditoria.SELECT;
          break;
        default:
          accion = AccionAuditoria.SELECT;
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Solo auditar si hay usuario autenticado
        if (!usuario || !usuario.sub) {
          return;
        }

        try {
          // Auditar SELECT (GET)
          if (accion === AccionAuditoria.SELECT) {
            await this.auditoriaService.logSelect(
              usuario.sub,
              metadata.tabla,
              ipAddress,
              endpoint,
              metadata.descripcion,
            );
            return;
          }

          // Auditar INSERT (POST)
          if (accion === AccionAuditoria.INSERT && response) {
            const registroId = response.id || response.data?.id;
            if (registroId) {
              await this.auditoriaService.logInsert(
                usuario.sub,
                metadata.tabla,
                registroId,
                response,
                ipAddress,
                endpoint,
              );
            }
            return;
          }

          // Auditar UPDATE (PUT/PATCH)
          if (accion === AccionAuditoria.UPDATE && response) {
            const registroId =
              request.params.id || response.id || response.data?.id;
            if (registroId) {
              await this.auditoriaService.logUpdate(
                usuario.sub,
                metadata.tabla,
                registroId,
                request.body, // Datos anteriores (aproximado)
                response,
                ipAddress,
                endpoint,
              );
            }
            return;
          }

          // Auditar DELETE
          if (accion === AccionAuditoria.DELETE) {
            const registroId = request.params.id;
            if (registroId) {
              await this.auditoriaService.logDelete(
                usuario.sub,
                metadata.tabla,
                registroId,
                request.body || { id: registroId },
                ipAddress,
                endpoint,
              );
            }
            return;
          }
        } catch (error) {
          console.error('Error en auditoría:', error);
          // No lanzar error para no interrumpir la operación principal
        }
      }),
    );
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}