import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';



async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
     app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // la ruta pública
  });

   
  // Habilitar CORS para el frontend
  app.enableCors({
  origin: ['http://localhost:5173', 'http://192.168.1.10:5173'],
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
  


 
const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');
console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
}
bootstrap();