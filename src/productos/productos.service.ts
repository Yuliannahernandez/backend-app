import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { Categoria } from '../entities/categoria.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
  ) {}

  async getProductos(categoriaId?: number) {
    const where: any = { disponible: true };
    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    const productos = await this.productoRepository.find({
      where,
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
    });

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      imagenPrincipal: p.imagenPrincipal,
      categoria: p.categoria.nombre,
      categoriaId: p.categoriaId,
      esNuevo: p.esNuevo,
      enTendencia: p.enTendencia,
    }));
  }

  async getProductosNuevos() {
    const productos = await this.productoRepository.find({
      where: { esNuevo: true, disponible: true },
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
      take: 10,
    });

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      imagenPrincipal: p.imagenPrincipal,
      categoria: p.categoria.nombre,
    }));
  }

  async getProductosTendencia() {
    const productos = await this.productoRepository.find({
      where: { enTendencia: true, disponible: true },
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
      take: 10,
    });

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      imagenPrincipal: p.imagenPrincipal,
      categoria: p.categoria.nombre,
    }));
  }

  async getProductoDestacado() {
    const producto = await this.productoRepository.findOne({
      where: { disponible: true, enTendencia: true },
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
    });

    if (!producto) {
      return null;
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagenPrincipal: producto.imagenPrincipal,
      categoria: producto.categoria.nombre,
    };
  }

  async getCategorias() {
    const categorias = await this.categoriaRepository.find({
      where: { activa: true },
      order: { orden: 'ASC' },
    });

    return categorias.map(c => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      icono: c.icono,
    }));
  }

  async getProductoDetalle(id: number) {
    const producto = await this.productoRepository.findOne({
      where: { id, disponible: true },
      relations: ['categoria', 'imagenes', 'ingredientes', 'ingredientes.ingrediente', 'informacionNutricional'],
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagenPrincipal: producto.imagenPrincipal,
      imagenes: producto.imagenes?.map(img => img.urlImagen) || [],
      categoria: producto.categoria.nombre,
      categoriaId: producto.categoriaId,
      tiempoPreparacion: producto.tiempoPreparacion,
      ingredientes: producto.ingredientes?.map(pi => ({
        nombre: pi.ingrediente.nombre,
        cantidad: pi.cantidad,
        esAlergeno: pi.ingrediente.esAlergeno,
      })) || [],
      informacionNutricional: producto.informacionNutricional ? {
        calorias: producto.informacionNutricional.calorias,
        proteinas: producto.informacionNutricional.proteinas,
        carbohidratos: producto.informacionNutricional.carbohidratos,
        grasas: producto.informacionNutricional.grasas,
        fibra: producto.informacionNutricional.fibra,
        sodio: producto.informacionNutricional.sodio,
        azucares: producto.informacionNutricional.azucares,
        porcion: producto.informacionNutricional.porcion,
      } : null,
    };
  }
}