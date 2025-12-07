import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', 
  });

  // CORS - Actualizado para producción
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://192.168.100.182:5173',
      'https://reelish-app.vercel.app',       
      'https://www.reelish-app.vercel.app' ,
      'https://reelish-nu.vercel.app'   
    ];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
});

  
  // Validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // Puerto dinámico para Render
  const port =parseInt( process.env.PORT, 10) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(` Servidor NestJS corriendo en http://0.0.0.0:${port}`);
  console.log(` Entorno: ${process.env.NODE_ENV}`);
  console.log(` Python API: ${process.env.PYTHON_API_URL}`);
}
bootstrap();