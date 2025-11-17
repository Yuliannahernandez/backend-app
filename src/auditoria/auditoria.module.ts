import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaInterceptor } from '../common/interceptors/auditoria.interceptor';

@Global() // ← Hacer global para que esté disponible en toda la app
@Module({
  imports: [HttpModule], // ← Ahora usa HttpModule en lugar de TypeORM
  controllers: [AuditoriaController],
  providers: [AuditoriaService, AuditoriaInterceptor],
  exports: [AuditoriaService, AuditoriaInterceptor],
})
export class AuditoriaModule {}