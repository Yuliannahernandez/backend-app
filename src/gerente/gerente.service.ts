import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { Categoria } from '../entities/categoria.entity';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { ProductoImagen } from '../entities/producto-imagen.entity';
import { ProductoIngrediente } from '../entities/producto-ingrediente.entity';
import { InformacionNutricional } from '../entities/informacion-nutricional.entity';

export interface ActualizarProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoriaId?: number;
  imagenPrincipal?: string;
  disponible?: boolean;
  stock?: number;
  tiempoPreparacion?: number;
  esNuevo?: boolean;
  enTendencia?: boolean;
}

export interface CrearProductoDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  imagenPrincipal?: string;
  disponible?: boolean;
  stock?: number;
  tiempoPreparacion?: number;
}

@Injectable()
export class GerenteService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoDetalle)
    private pedidoDetalleRepository: Repository<PedidoDetalle>,
  ) {}

  // ==================== GESTIÓN DE PRODUCTOS ====================

  async getProductosGestion() {
    const productos = await this.productoRepository.find({
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
    });

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      categoria: p.categoria.nombre,
      categoriaId: p.categoriaId,
      disponible: p.disponible,
      stock: p.stock,
      esNuevo: p.esNuevo,
      enTendencia: p.enTendencia,
      imagenPrincipal: p.imagenPrincipal,
      tiempoPreparacion: p.tiempoPreparacion,
    }));
  }

  async crearProducto(data: CrearProductoDto) {
    // Verificar que la categoría existe
    const categoria = await this.categoriaRepository.findOne({
      where: { id: data.categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const producto = this.productoRepository.create({
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      categoriaId: data.categoriaId,
      imagenPrincipal: data.imagenPrincipal,
      disponible: data.disponible ?? true,
      stock: data.stock ?? 0,
      tiempoPreparacion: data.tiempoPreparacion ?? 15,
    });

    const saved = await this.productoRepository.save(producto);

    return {
      id: saved.id,
      nombre: saved.nombre,
      mensaje: 'Producto creado exitosamente',
    };
  }

  async actualizarProducto(id: number, data: ActualizarProductoDto) {
    const producto = await this.productoRepository.findOne({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Si se cambia la categoría, verificar que existe
    if (data.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id: data.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    // Actualizar campos
    Object.assign(producto, data);
    await this.productoRepository.save(producto);

    return {
      id: producto.id,
      nombre: producto.nombre,
      mensaje: 'Producto actualizado exitosamente',
    };
  }

  async toggleDisponibilidad(id: number) {
    const producto = await this.productoRepository.findOne({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    producto.disponible = !producto.disponible;
    await this.productoRepository.save(producto);

    return {
      id: producto.id,
      disponible: producto.disponible,
      mensaje: `Producto ${producto.disponible ? 'activado' : 'desactivado'}`,
    };
  }

  async eliminarProducto(id: number) {
    const producto = await this.productoRepository.findOne({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.productoRepository.remove(producto);

    return {
      mensaje: 'Producto eliminado exitosamente',
    };
  }

  // ==================== GESTIÓN DE PEDIDOS ====================

  async getPedidosActivos() {
    const pedidos = await this.pedidoRepository.find({
      where: [
        { estado: 'confirmado' },
        { estado: 'en_preparacion' },
        { estado: 'listo' },
      ],
      relations: ['detalles', 'detalles.producto', 'sucursal'],
      order: { fechaCreacion: 'ASC' },
    });

    return pedidos.map(p => ({
      id: p.id,
      clienteId: p.clienteId,
      estado: p.estado,
      tipoEntrega: p.tipoEntrega,
      productos: p.detalles?.map(d => ({
        nombre: d.producto.nombre,
        cantidad: d.cantidad,
        precio: d.precioUnitario,
      })) || [],
      total: p.total,
      tiempoEstimado: p.tiempoEstimado,
      sucursal: p.sucursal?.nombre,
      fechaCreacion: p.fechaCreacion,
      fechaConfirmacion: p.fechaConfirmacion,
    }));
  }

  async cambiarEstadoPedido(pedidoId: number, nuevoEstado: string) {
    const estadosValidos = [
      'confirmado',
      'en_preparacion',
      'listo',
      'completado',
      'cancelado',
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException('Estado no válido');
    }

    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // No permitir cambiar estado de pedidos completados o cancelados
    if (pedido.estado === 'completado' || pedido.estado === 'cancelado') {
      throw new BadRequestException('No se puede cambiar el estado de este pedido');
    }

    pedido.estado = nuevoEstado;

    if (nuevoEstado === 'completado') {
      pedido.fechaCompletado = new Date();
    }

    await this.pedidoRepository.save(pedido);

    return {
      id: pedido.id,
      estado: pedido.estado,
      mensaje: `Pedido actualizado a: ${nuevoEstado}`,
    };
  }

  // ==================== REPORTES Y MÉTRICAS ====================

  async getReporteVentas(fechaInicio?: string, fechaFin?: string) {
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fin = fechaFin ? new Date(fechaFin) : new Date();

    // Pedidos completados en el rango
    const pedidos = await this.pedidoRepository.find({
      where: {
        estado: 'completado',
        fechaCompletado: Between(inicio, fin),
      },
      relations: ['detalles', 'detalles.producto'],
    });

    const totalVentas = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
    const totalPedidos = pedidos.length;
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    // Producto más vendido
    const productosVendidos = new Map<number, { nombre: string; cantidad: number; total: number }>();
    
    pedidos.forEach(pedido => {
      pedido.detalles?.forEach(detalle => {
        const key = detalle.productoId;
        const existing = productosVendidos.get(key) || {
          nombre: detalle.producto.nombre,
          cantidad: 0,
          total: 0,
        };
        
        existing.cantidad += detalle.cantidad;
        existing.total += Number(detalle.subtotal);
        productosVendidos.set(key, existing);
      });
    });

    const topProductos = Array.from(productosVendidos.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Ventas por día
    const ventasPorDia = new Map<string, number>();
    pedidos.forEach(pedido => {
      const fecha = pedido.fechaCompletado.toISOString().split('T')[0];
      ventasPorDia.set(fecha, (ventasPorDia.get(fecha) || 0) + Number(pedido.total));
    });

    return {
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
      },
      resumen: {
        totalVentas: Math.round(totalVentas * 100) / 100,
        totalPedidos,
        ticketPromedio: Math.round(ticketPromedio * 100) / 100,
      },
      topProductos,
      ventasPorDia: Array.from(ventasPorDia.entries()).map(([fecha, total]) => ({
        fecha,
        total: Math.round(total * 100) / 100,
      })),
    };
  }

  async getMetricasGenerales() {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));

    // Pedidos de hoy
    const pedidosHoy = await this.pedidoRepository.count({
      where: {
        fechaCreacion: Between(inicioHoy, finHoy),
        estado: 'completado',
      },
    });

    // Ventas de hoy
    const pedidosHoyData = await this.pedidoRepository.find({
      where: {
        fechaCreacion: Between(inicioHoy, finHoy),
        estado: 'completado',
      },
    });

    const ventasHoy = pedidosHoyData.reduce((sum, p) => sum + Number(p.total), 0);

    // Pedidos activos
    const pedidosActivos = await this.pedidoRepository.count({
      where: [
        { estado: 'confirmado' },
        { estado: 'en_preparacion' },
        { estado: 'listo' },
      ],
    });

    // Total productos
    const totalProductos = await this.productoRepository.count();

    // Productos disponibles
    const productosDisponibles = await this.productoRepository.count({
      where: { disponible: true },
    });

    return {
      hoy: {
        pedidos: pedidosHoy,
        ventas: Math.round(ventasHoy * 100) / 100,
      },
      pedidosActivos,
      productos: {
        total: totalProductos,
        disponibles: productosDisponibles,
      },
    };
  }
}