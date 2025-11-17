import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor'; 
import { LocalidadesModule } from './localidades/localidades.module';
import { TipoCambioModule } from './tipo-cambio/tipo-cambio.module';

@Module({ 
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    CommonModule,
   
    
    
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
    AuditoriaModule,
    LocalidadesModule,
    TipoCambioModule,
  ],
  providers: [
    // Interceptor de auditoría global
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
})
export class AppModule {}