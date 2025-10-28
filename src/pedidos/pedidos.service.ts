import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { Cliente } from '../entities/cliente.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { LealtadService } from '../lealtad/lealtad.service';
@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoDetalle)
    private pedidoDetalleRepository: Repository<PedidoDetalle>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
    private lealtadService: LealtadService,
  ) {}

  async crearPedidoDesdeCarrito(usuarioId: number) {
    console.log('Buscando cliente para usuario:', usuarioId);
    
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    console.log(' Cliente encontrado:', cliente.id);

    // Buscar el carrito
    const carrito = await this.pedidoRepository.findOne({
      where: { clienteId: cliente.id, estado: 'carrito' },
      relations: ['detalles', 'detalles.producto', 'sucursal'],
    });

    console.log(' Carrito encontrado:', carrito?.id);

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    if (!carrito.detalles || carrito.detalles.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    if (!carrito.sucursalId) {
      throw new BadRequestException('Debes seleccionar una sucursal');
    }

    // Cambiar estado del carrito a 'confirmado'
    carrito.estado = 'confirmado';
    carrito.fechaConfirmacion = new Date();
    
    // Calcular tiempo estimado si no existe
    if (!carrito.tiempoEstimado) {
      const tiempoPreparacion = carrito.detalles.reduce(
        (max, detalle) => Math.max(max, detalle.producto.tiempoPreparacion || 0),
        0
      ) || 30;
      carrito.tiempoEstimado = tiempoPreparacion;
    }

    await this.pedidoRepository.save(carrito);

    console.log(' Pedido creado con ID:', carrito.id);

     // AGREGAR PUNTOS DE LEALTAD
    try {
      const puntosGanados = await this.lealtadService.agregarPuntosPorCompra(
        usuarioId,      
        carrito.total,  
        carrito.id      
      );
      console.log(` Puntos agregados: ${puntosGanados}`);
    } catch (error) {
      console.error(' Error agregando puntos:', error);
      // No lanzamos el error para que el pedido se complete aunque falle los puntos
    }

    // Retornar el pedido completo
    return this.getPedido(usuarioId, carrito.id);
  }


  async getPedido(usuarioId: number, pedidoId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, clienteId: cliente.id },
      relations: ['detalles', 'detalles.producto', 'sucursal'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return {
      id: pedido.id,
      estado: pedido.estado,
      tipoEntrega: pedido.tipoEntrega,
      productos: pedido.detalles?.map(d => ({
        id: d.id,
        productoId: d.productoId,
        nombre: d.producto.nombre,
        precio: d.precioUnitario,
        cantidad: d.cantidad,
        subtotal: d.subtotal,
        imagen: d.producto.imagenPrincipal,
      })) || [],
      subtotal: pedido.subtotal,
      descuento: pedido.descuento,
      costoEnvio: pedido.costoEnvio,
      total: pedido.total,
      tiempoEstimado: pedido.tiempoEstimado,
      sucursal: pedido.sucursal ? {
        id: pedido.sucursal.id,
        nombre: pedido.sucursal.nombre,
        provincia: pedido.sucursal.provincia,
        direccion: pedido.sucursal.direccion,
        telefono: pedido.sucursal.telefono,
        horario: pedido.sucursal.horario,
      } : null,
      fechaCreacion: pedido.fechaCreacion,
      fechaConfirmacion: pedido.fechaConfirmacion,
    };
  }

  async getMisPedidos(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const pedidos = await this.pedidoRepository.find({
      where: { 
        clienteId: cliente.id,
      },
      relations: ['detalles', 'detalles.producto', 'sucursal'],
      order: { fechaCreacion: 'DESC' },
    });

    // Filtrar solo pedidos que no sean carritos
    return pedidos
      .filter(p => p.estado !== 'carrito')
      .map(pedido => ({
        id: pedido.id,
        estado: pedido.estado,
        total: pedido.total,
        cantidadProductos: pedido.detalles?.length || 0,
        sucursal: pedido.sucursal?.nombre,
        fechaCreacion: pedido.fechaCreacion,
      }));
  }

  async cancelarPedido(usuarioId: number, pedidoId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, clienteId: cliente.id },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado === 'completado' || pedido.estado === 'cancelado') {
      throw new BadRequestException('No se puede cancelar este pedido');
    }

    pedido.estado = 'cancelado';
    await this.pedidoRepository.save(pedido);

    return { message: 'Pedido cancelado exitosamente' };
  }
}