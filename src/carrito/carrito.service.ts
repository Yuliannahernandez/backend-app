import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { Cliente } from '../entities/cliente.entity';
import { Producto } from '../entities/producto.entity';
import { Sucursal } from '../entities/sucursal.entity';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoDetalle)
    private pedidoDetalleRepository: Repository<PedidoDetalle>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
  ) {}

 async getCarrito(usuarioId: number) {
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  // Buscar o crear carrito
  let carrito = await this.pedidoRepository.findOne({
    where: { clienteId: cliente.id, estado: 'carrito' },
    relations: ['detalles', 'detalles.producto'],
  });

  if (!carrito) {
    carrito = this.pedidoRepository.create({
      clienteId: cliente.id,
      estado: 'carrito',
      tipoEntrega: 'domicilio',
      subtotal: 0,
      total: 0,
    });
    await this.pedidoRepository.save(carrito);
  }

  // Calcular tiempo estimado
  const tiempoPreparacion = carrito.detalles?.reduce(
    (max, detalle) => Math.max(max, detalle.producto.tiempoPreparacion || 0),
    0
  ) || 15;

  const tiempoEntrega = carrito.tipoEntrega === 'domicilio' ? 30 : 0;
  const tiempoEstimado = tiempoPreparacion + tiempoEntrega;

  // Obtener información de la sucursal si está seleccionada
  let sucursal = null;
  if (carrito.sucursalId) {
    sucursal = await this.sucursalRepository.findOne({
      where: { id: carrito.sucursalId },
    });
  }

  return {
    id: carrito.id,
    tipoEntrega: carrito.tipoEntrega,
    productos: carrito.detalles?.map(d => ({
      id: d.id,
      productoId: d.productoId,
      nombre: d.producto.nombre,
      precio: d.precioUnitario,
      cantidad: d.cantidad,
      subtotal: d.subtotal,
      imagen: d.producto.imagenPrincipal,
    })) || [],
    subtotal: carrito.subtotal,
    descuento: carrito.descuento,
    costoEnvio: carrito.costoEnvio,
    total: carrito.total,
    tiempoEstimado,
    sucursal: sucursal ? {
      id: sucursal.id,
      nombre: sucursal.nombre,
      provincia: sucursal.provincia,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      horario: sucursal.horario,
    } : null,
  };
}

  async agregarProducto(usuarioId: number, productoId: number, cantidad: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!producto.disponible) {
      throw new BadRequestException('Producto no disponible');
    }

    // Buscar o crear carrito
    let carrito = await this.pedidoRepository.findOne({
      where: { clienteId: cliente.id, estado: 'carrito' },
      relations: ['detalles'],
    });

    if (!carrito) {
      carrito = this.pedidoRepository.create({
        clienteId: cliente.id,
        estado: 'carrito',
        tipoEntrega: 'domicilio',
        subtotal: 0,
        total: 0,
      });
      await this.pedidoRepository.save(carrito);
    }

    // Verificar si el producto ya está en el carrito
    let detalle = carrito.detalles?.find(d => d.productoId === productoId);

    if (detalle) {
      // Actualizar cantidad
      detalle.cantidad += cantidad;
      detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
      await this.pedidoDetalleRepository.save(detalle);
    } else {
      // Agregar nuevo producto
      detalle = this.pedidoDetalleRepository.create({
        pedidoId: carrito.id,
        productoId,
        cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * cantidad,
      });
      await this.pedidoDetalleRepository.save(detalle);
    }

    // Recalcular totales
    await this.recalcularTotales(carrito.id);

    return this.getCarrito(usuarioId);
  }

  async actualizarCantidad(usuarioId: number, detalleId: number, cantidad: number) {
    if (cantidad < 1) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const detalle = await this.pedidoDetalleRepository.findOne({
      where: { id: detalleId },
      relations: ['pedido'],
    });

    if (!detalle || detalle.pedido.clienteId !== cliente.id) {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }

    detalle.cantidad = cantidad;
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    await this.pedidoDetalleRepository.save(detalle);

    await this.recalcularTotales(detalle.pedidoId);

    return this.getCarrito(usuarioId);
  }

  async eliminarProducto(usuarioId: number, detalleId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const detalle = await this.pedidoDetalleRepository.findOne({
      where: { id: detalleId },
      relations: ['pedido'],
    });

    if (!detalle || detalle.pedido.clienteId !== cliente.id) {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }

    const pedidoId = detalle.pedidoId;
    await this.pedidoDetalleRepository.remove(detalle);

    await this.recalcularTotales(pedidoId);

    return this.getCarrito(usuarioId);
  }

  async cambiarTipoEntrega(usuarioId: number, tipoEntrega: 'domicilio' | 'recoger_tienda') {
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
      throw new NotFoundException('Carrito no encontrado');
    }

    carrito.tipoEntrega = tipoEntrega;
    
    // Si es recoger en tienda, el costo de envío es 0
    if (tipoEntrega === 'recoger_tienda') {
      carrito.costoEnvio = 0;
    } else {
      // Calcular costo de envío (puedes ajustar esta lógica)
      carrito.costoEnvio = carrito.subtotal > 10000 ? 0 : 1500;
    }

    carrito.total = carrito.subtotal - carrito.descuento + carrito.costoEnvio;
    await this.pedidoRepository.save(carrito);

    return this.getCarrito(usuarioId);
  }

  async vaciarCarrito(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const carrito = await this.pedidoRepository.findOne({
      where: { clienteId: cliente.id, estado: 'carrito' },
      relations: ['detalles'],
    });

    if (carrito && carrito.detalles) {
      await this.pedidoDetalleRepository.remove(carrito.detalles);
      carrito.subtotal = 0;
      carrito.total = 0;
      await this.pedidoRepository.save(carrito);
    }

    return this.getCarrito(usuarioId);
  }

  async seleccionarMetodoPago(usuarioId: number, metodoPagoId: string | number) {
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
    throw new NotFoundException('Carrito no encontrado');
  }

  
  if (metodoPagoId === 'efectivo') {
    carrito.metodoPagoId = null;
  } else {
    carrito.metodoPagoId = Number(metodoPagoId);
  }
  
  await this.pedidoRepository.save(carrito);

  return this.getCarrito(usuarioId);
}

  private async recalcularTotales(pedidoId: number) {
    const carrito = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: ['detalles'],
    });

    if (!carrito) return;

    const subtotal = carrito.detalles?.reduce((sum, d) => sum + Number(d.subtotal), 0) || 0;
    
    // Calcular costo de envío
    let costoEnvio = 0;
    if (carrito.tipoEntrega === 'domicilio') {
      costoEnvio = subtotal > 10000 ? 0 : 1500;
    }

    carrito.subtotal = subtotal;
    carrito.costoEnvio = costoEnvio;
    carrito.total = subtotal - carrito.descuento + costoEnvio;

    await this.pedidoRepository.save(carrito);
  }

  async seleccionarSucursal(usuarioId: number, sucursalId: number) {
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
    throw new NotFoundException('Carrito no encontrado');
  }

  carrito.sucursalId = sucursalId;
  await this.pedidoRepository.save(carrito);

  return this.getCarrito(usuarioId);
}
  
}