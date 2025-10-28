import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { PuntosHistorial } from '../entities/puntos-historial.entity';
import { Recompensa } from '../entities/recompensa.entity';
import { Cupon } from '../entities/cupon.entity';

@Injectable()
export class LealtadService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(PuntosHistorial)
    private puntosHistorialRepository: Repository<PuntosHistorial>,
    @InjectRepository(Recompensa)
    private recompensaRepository: Repository<Recompensa>,
    @InjectRepository(Cupon)
    private cuponRepository: Repository<Cupon>,
  ) {}

  async getPuntos(usuarioId: number) {
    console.log('Obteniendo puntos para usuario:', usuarioId);

    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    console.log('Puntos del cliente:', cliente.puntosLealtad);

    return {
      puntos: cliente.puntosLealtad || 0,
      clienteId: cliente.id,
    };
  }

  async getHistorial(usuarioId: number) {
    console.log(' Obteniendo historial para usuario:', usuarioId);

    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const historial = await this.puntosHistorialRepository.find({
      where: { clienteId: cliente.id },
      order: { fecha: 'DESC' },
      take: 50,
    });

    console.log(`Historial encontrado: ${historial.length} registros`);

    return historial.map(registro => ({
      id: registro.id,
      puntos: registro.puntos,
      tipo: registro.tipo,
      descripcion: registro.descripcion,
      fecha: registro.fecha,
      pedidoId: registro.pedidoId,
      recompensaId: registro.recompensaId,
    }));
  }

  async getRecompensasDisponibles() {
    const recompensas = await this.recompensaRepository.find({
      where: { activa: true },
      order: { puntosRequeridos: 'ASC' },
    });

    console.log(` Recompensas disponibles: ${recompensas.length}`);

    return recompensas.map(recompensa => ({
      id: recompensa.id,
      nombre: recompensa.nombre,
      descripcion: recompensa.descripcion,
      puntosRequeridos: recompensa.puntosRequeridos,
      tipo: recompensa.tipo,
      valor: recompensa.valor,
    }));
  }

  async canjearRecompensa(usuarioId: number, recompensaId: number) {
    console.log('Canjeando recompensa:', recompensaId, 'para usuario:', usuarioId);

    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    console.log(' Cliente encontrado:', cliente.id, 'Puntos:', cliente.puntosLealtad);

    const recompensa = await this.recompensaRepository.findOne({
      where: { id: recompensaId, activa: true },
    });

    if (!recompensa) {
      throw new NotFoundException('Recompensa no encontrada');
    }

    console.log('Recompensa encontrada:', recompensa.nombre);

    if (cliente.puntosLealtad < recompensa.puntosRequeridos) {
      throw new BadRequestException(
        `No tienes suficientes puntos. Necesitas ${recompensa.puntosRequeridos} puntos y solo tienes ${cliente.puntosLealtad}`
      );
    }

    // Descontar puntos
    cliente.puntosLealtad -= recompensa.puntosRequeridos;
    await this.clienteRepository.save(cliente);

    console.log('Puntos descontados. Nuevos puntos:', cliente.puntosLealtad);

    // Registrar en historial
    const registro = this.puntosHistorialRepository.create({
      clienteId: cliente.id,
      puntos: -recompensa.puntosRequeridos,
      tipo: 'canjeado',
      recompensaId: recompensa.id,
      descripcion: `Canjeado: ${recompensa.nombre}`,
    });
    await this.puntosHistorialRepository.save(registro);

    console.log(' Historial registrado');

    // Si la recompensa es un cupón, generarlo
    let cuponGenerado = null;
    if (recompensa.tipo === 'cupon' || recompensa.tipo === 'descuento') {
      cuponGenerado = await this.generarCuponRecompensa(cliente.id, recompensa);
      console.log(' Cupón generado:', cuponGenerado.codigo);
    }

    return {
      success: true,
      mensaje: 'Recompensa canjeada exitosamente',
      puntosRestantes: cliente.puntosLealtad,
      recompensa: {
        id: recompensa.id,
        nombre: recompensa.nombre,
        tipo: recompensa.tipo,
      },
      cupon: cuponGenerado,
    };
  }

  private async generarCuponRecompensa(clienteId: number, recompensa: Recompensa) {
    const codigo = `REWARD${clienteId}${Date.now().toString().slice(-6)}`;
    
    // Determinar descuento basado en el valor de la recompensa
    let tipoDescuento: 'porcentaje' | 'monto_fijo' = 'monto_fijo';
    let valorDescuento = 1000;

    if (recompensa.valor) {
      if (recompensa.valor.includes('%')) {
        tipoDescuento = 'porcentaje';
        valorDescuento = parseFloat(recompensa.valor.replace('%', ''));
      } else {
        valorDescuento = parseFloat(recompensa.valor);
      }
    }

    const fechaInicio = new Date();
    const fechaFin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const cupon = this.cuponRepository.create({
      codigo,
      descripcion: `Recompensa canjeada: ${recompensa.nombre}`,
      tipoDescuento,
      valorDescuento,
      montoMinimo: 0,
      fechaInicio,
      fechaFin,
      usosMaximos: 1,
      usosPorCliente: 1,
      activo: true,
    });

    await this.cuponRepository.save(cupon);

    return {
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      tipoDescuento: cupon.tipoDescuento,
      valorDescuento: cupon.valorDescuento,
      fechaExpiracion: cupon.fechaFin,
    };
  }

  async agregarPuntosPorCompra(usuarioId: number, montoCompra: number, pedidoId: number) {
  console.log(' Agregando puntos por compra. Usuario:', usuarioId, 'Monto:', montoCompra);

  // Buscar cliente por usuarioId en lugar de clienteId
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    console.error(' Cliente no encontrado para usuarioId:', usuarioId);
    return 0;
  }

  // 10 puntos por cada 1000 colones
  const puntosGanados = Math.floor(montoCompra / 1000) * 10;
  console.log('Puntos a ganar:', puntosGanados);

  if (puntosGanados > 0) {
    cliente.puntosLealtad += puntosGanados;
    await this.clienteRepository.save(cliente);

    const registro = this.puntosHistorialRepository.create({
      clienteId: cliente.id, 
      puntos: puntosGanados,
      tipo: 'ganado',
      pedidoId,
      descripcion: `Ganados por compra de ₡${montoCompra.toLocaleString()}`,
    });
    await this.puntosHistorialRepository.save(registro);

    console.log(' Puntos agregados exitosamente');
  }

  return puntosGanados;
}
}