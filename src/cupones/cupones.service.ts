import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cupon } from '../entities/cupon.entity';
import { CuponUso } from '../entities/cupon-uso.entity';
import { Pedido } from '../entities/pedido.entity';
import { Cliente } from '../entities/cliente.entity';

@Injectable()
export class CuponesService {
  constructor(
    @InjectRepository(Cupon)
    private cuponRepository: Repository<Cupon>,
    @InjectRepository(CuponUso)
    private cuponUsoRepository: Repository<CuponUso>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

 async validarCupon(codigo: string, usuarioId: number) {
  console.log('Validando cupón:', codigo, 'para usuario:', usuarioId);

  // Verificar que código no sea undefined
  if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
    throw new BadRequestException('El código de cupón es requerido y debe ser texto válido');
  }

  // Primero buscar el cliente
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  console.log(' Cliente encontrado:', cliente.id);

  
  const codigoNormalizado = codigo.trim().toUpperCase();

  const cupon = await this.cuponRepository.findOne({
    where: { codigo: codigoNormalizado, activo: true },
  });

  if (!cupon) {
    console.log('Cupón no encontrado o inactivo');
    throw new NotFoundException('Cupón no encontrado o inactivo');
  }

  console.log(' Cupón encontrado:', cupon);

  const hoy = new Date();
  
  // Validar fechas
  if (cupon.fechaInicio > hoy) {
    throw new BadRequestException('El cupón aún no está disponible');
  }

  if (cupon.fechaFin < hoy) {
    throw new BadRequestException('El cupón ha expirado');
  }

  // Validar usos totales
  if (cupon.usosMaximos) {
    const usosActuales = await this.cuponUsoRepository.count({
      where: { cuponId: cupon.id },
    });

    console.log(` Usos actuales: ${usosActuales} / ${cupon.usosMaximos}`);

    if (usosActuales >= cupon.usosMaximos) {
      throw new BadRequestException('El cupón ha alcanzado su límite de usos');
    }
  }

  // Validar usos por cliente
  const usosCliente = await this.cuponUsoRepository.count({
    where: { cuponId: cupon.id, clienteId: cliente.id },
  });

  console.log(` Usos del cliente: ${usosCliente} / ${cupon.usosPorCliente}`);

  if (usosCliente >= cupon.usosPorCliente) {
    throw new BadRequestException('Ya has usado este cupón el máximo de veces permitido');
  }

  return {
    valido: true,
    cupon: {
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      tipoDescuento: cupon.tipoDescuento,
      valorDescuento: cupon.valorDescuento,
      montoMinimo: cupon.montoMinimo,
    },
  };
}

async aplicarCuponAlCarrito(codigo: string, usuarioId: number) {
  console.log(' Aplicando cupón:', codigo, 'para usuario:', usuarioId);

  
  if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
    throw new BadRequestException('El código de cupón es requerido');
  }

  const codigoNormalizado = codigo.trim().toUpperCase();

  // Buscar el cliente primero
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  console.log(' Cliente encontrado:', cliente.id);

  // Validar cupón
  try {
    await this.validarCupon(codigoNormalizado, usuarioId);
  } catch (error) {
    console.error(' Error validando cupón:', error.message);
    throw error;
  }

  // Buscar el carrito actual
  const carrito = await this.pedidoRepository.findOne({
    where: { clienteId: cliente.id, estado: 'carrito' },
  });

  if (!carrito) {
    console.log('No hay carrito activo');
    throw new NotFoundException('No tienes un carrito activo');
  }

  console.log(' Carrito encontrado:', carrito.id, 'Subtotal:', carrito.subtotal);

  const cupon = await this.cuponRepository.findOne({
    where: { codigo: codigoNormalizado },
  });

  // Validar monto mínimo
  if (Number(carrito.subtotal) < Number(cupon.montoMinimo)) {
    throw new BadRequestException(
      `El monto mínimo para usar este cupón es ₡${Number(cupon.montoMinimo).toLocaleString()}`,
    );
  }

  // Calcular descuento
  let descuento = 0;
  if (cupon.tipoDescuento === 'porcentaje') {
    descuento = (Number(carrito.subtotal) * Number(cupon.valorDescuento)) / 100;
  } else {
    descuento = Number(cupon.valorDescuento);
  }

  // El descuento no puede ser mayor al subtotal
  descuento = Math.min(descuento, Number(carrito.subtotal));

  console.log(' Descuento calculado:', descuento);

  // Actualizar carrito
  carrito.cuponAplicado = cupon.codigo;
  carrito.descuento = descuento;
  carrito.total = Number(carrito.subtotal) - descuento + Number(carrito.costoEnvio);

  await this.pedidoRepository.save(carrito);

  console.log(' Cupón aplicado exitosamente');

  return {
    success: true,
    mensaje: 'Cupón aplicado exitosamente',
    cupon: {
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      descuento,
    },
    carrito: {
      subtotal: Number(carrito.subtotal),
      descuento: Number(carrito.descuento),
      total: Number(carrito.total),
    },
  };
}
  async removerCuponDelCarrito(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const carrito = await this.pedidoRepository.findOne({
      where: { clienteId: cliente.id, estado: 'carrito' },
    });

    if (!carrito) {
      throw new NotFoundException('No tienes un carrito activo');
    }

    carrito.cuponAplicado = null;
    carrito.descuento = 0;
    carrito.total = Number(carrito.subtotal) + Number(carrito.costoEnvio);

    await this.pedidoRepository.save(carrito);

    return {
      success: true,
      mensaje: 'Cupón removido',
      carrito: {
        subtotal: Number(carrito.subtotal),
        descuento: Number(carrito.descuento),
        total: Number(carrito.total),
      },
    };
  }

  async getCuponesDisponibles(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const hoy = new Date();

    const cupones = await this.cuponRepository.find({
      where: {
        activo: true,
      },
      order: { valorDescuento: 'DESC' },
    });

    console.log(` Cupones encontrados: ${cupones.length}`);

    // Filtrar cupones según usos y fechas
    const cuponesDisponibles = [];
    for (const cupon of cupones) {
      // Verificar fechas
      if (cupon.fechaInicio <= hoy && cupon.fechaFin >= hoy) {
        // Verificar usos del cliente
        const usosCliente = await this.cuponUsoRepository.count({
          where: { cuponId: cupon.id, clienteId: cliente.id },
        });

        if (usosCliente < cupon.usosPorCliente) {
          // Verificar usos totales
          if (cupon.usosMaximos) {
            const usosActuales = await this.cuponUsoRepository.count({
              where: { cuponId: cupon.id },
            });

            if (usosActuales < cupon.usosMaximos) {
              cuponesDisponibles.push({
                codigo: cupon.codigo,
                descripcion: cupon.descripcion,
                tipoDescuento: cupon.tipoDescuento,
                valorDescuento: Number(cupon.valorDescuento),
                montoMinimo: Number(cupon.montoMinimo),
                fechaFin: cupon.fechaFin,
              });
            }
          } else {
            cuponesDisponibles.push({
              codigo: cupon.codigo,
              descripcion: cupon.descripcion,
              tipoDescuento: cupon.tipoDescuento,
              valorDescuento: Number(cupon.valorDescuento),
              montoMinimo: Number(cupon.montoMinimo),
              fechaFin: cupon.fechaFin,
            });
          }
        }
      }
    }

    console.log(` Cupones disponibles: ${cuponesDisponibles.length}`);

    return cuponesDisponibles;
  }

  async registrarUsoCupon(cuponCodigo: string, clienteId: number, pedidoId: number) {
    console.log('Registrando uso de cupón:', cuponCodigo);

    const cupon = await this.cuponRepository.findOne({
      where: { codigo: cuponCodigo },
    });

    if (!cupon) {
      console.log(' Cupón no encontrado');
      return;
    }

    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    const uso = this.cuponUsoRepository.create({
      cuponId: cupon.id,
      clienteId,
      pedidoId,
      descuentoAplicado: Number(pedido?.descuento) || 0,
    });

    await this.cuponUsoRepository.save(uso);
    console.log(' Uso de cupón registrado');
  }
}