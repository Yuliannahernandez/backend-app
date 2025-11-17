// ============================================================
// src/common/common.module.ts
// ============================================================
import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseApiService } from './services/database-api.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [DatabaseApiService],
  exports: [DatabaseApiService],
})
export class CommonModule {}