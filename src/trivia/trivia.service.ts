import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { TriviaPregunta } from '../entities/trivia-pregunta.entity';
import { TriviaRespuesta } from '../entities/trivia-respuesta.entity';
import { TriviaPartida } from '../entities/trivia-partida.entity';
import { TriviaRespuestaJugador } from '../entities/trivia-respuesta-jugador.entity';
import { Cupon } from '../entities/cupon.entity';

@Injectable()
export class TriviaService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(TriviaPregunta)
    private preguntaRepository: Repository<TriviaPregunta>,
    @InjectRepository(TriviaRespuesta)
    private respuestaRepository: Repository<TriviaRespuesta>,
    @InjectRepository(TriviaPartida)
    private partidaRepository: Repository<TriviaPartida>,
    @InjectRepository(TriviaRespuestaJugador)
    private respuestaJugadorRepository: Repository<TriviaRespuestaJugador>,
    @InjectRepository(Cupon)
    private cuponRepository: Repository<Cupon>,
  ) {}

  async iniciarPartida(usuarioId: number, pedidoId?: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
      
    }

    const partida = this.partidaRepository.create({
      clienteId: cliente.id,
      pedidoId: pedidoId || null,
      puntajeTotal: 0,
      preguntasCorrectas: 0,
      preguntasTotales: 0,
      completada: false,
    });

    await this.partidaRepository.save(partida);

    console.log(' Partida creada:', partida.id);

    return {
      id: partida.id,
      mensaje: 'Partida iniciada exitosamente',
    };
  }

  async obtenerPreguntaSiguiente(usuarioId: number, partidaId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const partida = await this.partidaRepository.findOne({
      where: { id: partidaId, clienteId: cliente.id },
      relations: ['respuestas'],
    });

    if (!partida) {
      throw new NotFoundException('Partida no encontrada');
    }

    if (partida.completada) {
      throw new BadRequestException('La partida ya ha finalizado');
    }

    // Obtener IDs de preguntas ya respondidas
    const preguntasRespondidas = partida.respuestas.map(r => r.preguntaId);

    // Buscar una pregunta que no haya sido respondida
    let pregunta: TriviaPregunta;
    
    if (preguntasRespondidas.length > 0) {
      pregunta = await this.preguntaRepository.findOne({
        where: {
          activa: true,
          id: Not(In(preguntasRespondidas)),
        },
        order: { id: 'ASC' },
      });
    } else {
      pregunta = await this.preguntaRepository.findOne({
        where: { activa: true },
        order: { id: 'ASC' },
      });
    }

    if (!pregunta) {
      // No hay más preguntas disponibles
      throw new NotFoundException('No hay más preguntas disponibles');
    }

    // Obtener las respuestas de la pregunta
    const respuestas = await this.respuestaRepository.find({
      where: { preguntaId: pregunta.id },
      order: { id: 'ASC' },
    });

    // Mezclar las respuestas
    const respuestasMezcladas = this.mezclarArray(respuestas);

    return {
      pregunta: {
        id: pregunta.id,
        pregunta: pregunta.pregunta,
        categoria: pregunta.categoria,
        dificultad: pregunta.dificultad,
      },
      respuestas: respuestasMezcladas.map(r => ({
        id: r.id,
        respuesta: r.respuesta,
      })),
    };
  }

async responderPregunta(
  usuarioId: number,
  partidaId: number,
  preguntaId: number,
  respuestaId: number,
  tiempoRespuesta: number,
) {
  
  console.log(' Parámetros recibidos:', {
    usuarioId,
    partidaId,
    preguntaId,
    respuestaId,
    tiempoRespuesta,
  });

  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  const partida = await this.partidaRepository.findOne({
    where: { id: partidaId, clienteId: cliente.id },
  });

  if (!partida) {
    throw new NotFoundException('Partida no encontrada');
  }

  // Verificar la respuesta
  const respuesta = await this.respuestaRepository.findOne({
    where: { id: respuestaId, preguntaId },
  });

  if (!respuesta) {
    throw new NotFoundException('Respuesta no encontrada');
  }

  const esCorrecta = respuesta.esCorrecta;

  // Calcular puntos
  let puntosGanados = 0;
  if (esCorrecta) {
    puntosGanados = 100;
    if (tiempoRespuesta <= 5) puntosGanados += 50;
    else if (tiempoRespuesta <= 10) puntosGanados += 25;
  }

  
  try {
    console.log(' Guardando con SQL directo:', {
      partidaId: partida.id,
      preguntaId,
      respuestaId,
      esCorrecta,
      tiempoRespuesta,
    });

    await this.respuestaJugadorRepository.query(
      `INSERT INTO trivia_respuestas_jugador 
       (partida_id, pregunta_id, respuesta_seleccionada_id, es_correcta, tiempo_respuesta_segundos, fecha_respuesta) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [partida.id, preguntaId, respuestaId, esCorrecta ? 1 : 0, tiempoRespuesta]
    );

    console.log(' Respuesta guardada exitosamente');
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    throw new BadRequestException('Error al guardar la respuesta');
  }

  // Actualizar la partida
  partida.preguntasTotales += 1;
  if (esCorrecta) {
    partida.preguntasCorrectas += 1;
    partida.puntajeTotal += puntosGanados;
  }

  await this.partidaRepository.save(partida);

  console.log(`${esCorrecta ? 'si' : 'no'} Respuesta ${esCorrecta ? 'correcta' : 'incorrecta'} - Puntos: ${puntosGanados}`);

  return {
    esCorrecta,
    puntosGanados,
    puntajeTotal: partida.puntajeTotal,
    correctas: partida.preguntasCorrectas,
  };
}

  async finalizarPartida(usuarioId: number, partidaId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const partida = await this.partidaRepository.findOne({
      where: { id: partidaId, clienteId: cliente.id },
      relations: ['respuestas'],
    });

    if (!partida) {
      throw new NotFoundException('Partida no encontrada');
    }

    partida.completada = true;
    partida.fechaFin = new Date();

    // Calcular tiempo total
    const tiempoTotal = partida.respuestas.reduce(
      (sum, r) => sum + (r.tiempoRespuestaSegundos || 0),
      0,
    );
    partida.tiempoTotalSegundos = tiempoTotal;

    // Determinar si gana cupón (4 o 5 correctas)
    let cuponGanado = null;
    if (partida.preguntasCorrectas >= 4) {
      cuponGanado = await this.generarCuponTrivia(cliente.id, partida.preguntasCorrectas);
      partida.cuponGanadoId = cuponGanado.id;
    }

    await this.partidaRepository.save(partida);

    console.log(' Partida finalizada - Correctas:', partida.preguntasCorrectas);

    return {
      partidaId: partida.id,
      puntajeTotal: partida.puntajeTotal,
      correctas: partida.preguntasCorrectas,
      totales: partida.preguntasTotales,
      tiempoTotal: partida.tiempoTotalSegundos,
      cuponGanado: cuponGanado
        ? {
            codigo: cuponGanado.codigo,
            descripcion: cuponGanado.descripcion,
            tipoDescuento: cuponGanado.tipoDescuento,
            valorDescuento: cuponGanado.valorDescuento,
          }
        : null,
    };
  }

  async obtenerHistorial(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const partidas = await this.partidaRepository.find({
      where: { clienteId: cliente.id, completada: true },
      order: { fechaInicio: 'DESC' },
      take: 10,
    });

    return partidas.map(p => ({
      id: p.id,
      puntajeTotal: p.puntajeTotal,
      correctas: p.preguntasCorrectas,
      totales: p.preguntasTotales,
      fecha: p.fechaInicio,
      ganoCupon: p.cuponGanadoId !== null,
    }));
  }

  private async generarCuponTrivia(clienteId: number, correctas: number) {
    const codigo = `TRIVIA${clienteId}${Date.now().toString().slice(-6)}`;
    
    // 4 correctas = 15% descuento, 5 correctas = 20% descuento
    const valorDescuento = correctas === 5 ? 20 : 15;

    const fechaInicio = new Date();
    const fechaFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const cupon = this.cuponRepository.create({
      codigo,
      descripcion: `Cupón ganado en Trivia - ${correctas}/5 correctas`,
      tipoDescuento: 'porcentaje',
      valorDescuento,
      montoMinimo: 5000,
      fechaInicio,
      fechaFin,
      usosMaximos: 1,
      usosPorCliente: 1,
      activo: true,
    });

    await this.cuponRepository.save(cupon);

    console.log(' Cupón de trivia generado:', cupon.codigo);

    return cupon;
  }

  private mezclarArray<T>(array: T[]): T[] {
    const nuevoArray = [...array];
    for (let i = nuevoArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
    }
    return nuevoArray;
  }
}