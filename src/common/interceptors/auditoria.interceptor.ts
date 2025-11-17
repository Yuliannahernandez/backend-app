import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { AccionAuditoria } from '../../entities/auditoria.entity';
import { Reflector } from '@nestjs/core';


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

    console.log(' === INTERCEPTOR EJECUTADO ===');
    console.log(' Metadata:', metadata);
    console.log(' Endpoint:', request.url);
    console.log(' Método:', request.method);

    // Si no hay metadata de auditoría, continuar sin auditar
    if (!metadata) {
      console.log(' No hay metadata de auditoría - saliendo');
      return next.handle();
    }

    const usuario = request.user;
    console.log(' Usuario completo:', usuario);
    console.log(' Usuario.sub:', usuario?.sub);
    
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

    console.log('⚡ Acción determinada:', accion);

    return next.handle().pipe(
      tap(async (response) => {
        console.log(' Respuesta recibida:', response);
        
        // Solo auditar si hay usuario autenticado
        if (!usuario || !usuario.sub) {
          console.log(' No hay usuario autenticado - no se auditará');
          return;
        }

        console.log(' Usuario autenticado - procediendo a auditar');

        try {
          // Auditar SELECT (GET)
          if (accion === AccionAuditoria.SELECT) {
            console.log(' Auditando SELECT...');
            await this.auditoriaService.logSelect(
              usuario.sub,
              metadata.tabla,
              ipAddress,
              endpoint,
              metadata.descripcion,
            );
            console.log(' SELECT auditado correctamente');
            return;
          }

          // Auditar INSERT (POST)
          if (accion === AccionAuditoria.INSERT && response) {
            const registroId = response.id || response.data?.id;
            console.log(' Auditando INSERT - registroId:', registroId);
            if (registroId) {
              await this.auditoriaService.logInsert(
                usuario.sub,
                metadata.tabla,
                registroId,
                response,
                ipAddress,
                endpoint,
              );
              console.log(' INSERT auditado correctamente');
            } else {
              console.log(' No se encontró registroId en la respuesta');
            }
            return;
          }

          // Auditar UPDATE (PUT/PATCH)
          if (accion === AccionAuditoria.UPDATE && response) {
            const registroId =
              request.params.id || response.id || response.data?.id;
            console.log(' Auditando UPDATE - registroId:', registroId);
            if (registroId) {
              await this.auditoriaService.logUpdate(
                usuario.sub,
                metadata.tabla,
                registroId,
                request.body, 
                response,
                ipAddress,
                endpoint,
              );
              console.log(' UPDATE auditado correctamente');
            } else {
              console.log(' No se encontró registroId para UPDATE');
            }
            return;
          }

          // Auditar DELETE
          if (accion === AccionAuditoria.DELETE) {
            const registroId = request.params.id;
            console.log(' Auditando DELETE - registroId:', registroId);
            if (registroId) {
              await this.auditoriaService.logDelete(
                usuario.sub,
                metadata.tabla,
                registroId,
                request.body || { id: registroId },
                ipAddress,
                endpoint,
              );
              console.log(' DELETE auditado correctamente');
            } else {
              console.log(' No se encontró registroId para DELETE');
            }
            return;
          }
        } catch (error) {
          console.error(' Error en auditoría:', error);
          console.error('Stack trace:', error.stack);
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