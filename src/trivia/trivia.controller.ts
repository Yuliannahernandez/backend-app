import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class IniciarPartidaDto {
  pedidoId?: number;
}

class ResponderPreguntaDto {
  partidaId: number;
  preguntaId: number;
  respuestaId: number;
  tiempoRespuesta: number;
}

@Controller('trivia')
@UseGuards(JwtAuthGuard)
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post('iniciar')
async iniciarPartida(@Request() req, @Body() data: any) {
  const usuarioId = req.user.sub || req.user.userId;
  console.log('Iniciar partida - Usuario ID:', usuarioId);
  console.log(' Body recibido:', data);
  return this.triviaService.iniciarPartida(usuarioId, data.pedidoId);
}


  @Get('pregunta/:partidaId')
  async obtenerPregunta(@Request() req, @Param('partidaId') partidaId: number) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log('Obtener pregunta - Partida ID:', partidaId);
    return this.triviaService.obtenerPreguntaSiguiente(usuarioId, partidaId);
  }

  @Post('responder')
  async responderPregunta(@Request() req, @Body() data: any) {  
    const usuarioId = req.user.sub || req.user.userId;
    
   
    console.log(' Controller - Raw body:', data);
    console.log(' Controller - Keys:', Object.keys(data));
    console.log(' Controller - Values:', Object.values(data));
    
    
    const { partidaId, preguntaId, respuestaId, tiempoRespuesta } = data;
    
    console.log('Controller - Valores extraídos:', {
      partidaId,
      preguntaId,
      respuestaId,
      tiempoRespuesta,
    });
    
  
    
    return this.triviaService.responderPregunta(
      usuarioId,
      partidaId,
      preguntaId,
      respuestaId,
      tiempoRespuesta,
    );
  }

  @Post('finalizar/:partidaId')
  async finalizarPartida(@Request() req, @Param('partidaId') partidaId: number) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log(' Finalizar partida - Partida ID:', partidaId);
    return this.triviaService.finalizarPartida(usuarioId, partidaId);
  }

  @Get('historial')
  async obtenerHistorial(@Request() req) {
    const usuarioId = req.user.sub || req.user.userId;
    console.log('Obtener historial - Usuario ID:', usuarioId);
    return this.triviaService.obtenerHistorial(usuarioId);
  }
}