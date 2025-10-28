import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module'; 
import { ProductosModule } from './productos/productos.module';
import { CarritoModule } from './carrito/carrito.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { PedidosModule } from './pedidos/pedidos.module'; 
import { TriviaModule } from './trivia/trivia.module';
import { CategoriasModule } from './categorias/categorias.module';
import { CuponesModule } from './cupones/cupones.module';
import { GerenteModule } from './gerente/gerente.module';
import { LealtadModule } from './lealtad/lealtad.module';
import { ClientesModule } from './clientes/clientes.module';
@Module({ 
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Configuración de TypeORM para MySQL
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, 
      logging: process.env.NODE_ENV === 'development',
    }),
    
    // Módulos de la aplicación
    AuthModule,
    ProfileModule,
    ProductosModule,
    CarritoModule,
    SucursalesModule,
    PedidosModule,
    LealtadModule,
    TriviaModule, 
    CategoriasModule,
    CuponesModule,
    ClientesModule,
    GerenteModule,
  ],
})
export class AppModule {}