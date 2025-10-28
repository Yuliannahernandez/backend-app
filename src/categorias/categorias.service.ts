import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../entities/categoria.entity';
import { Producto } from '../entities/producto.entity';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async getCategorias() {
    return this.categoriaRepository.find({
      where: { activa: true },
      order: { orden: 'ASC' },
    });
  }

  async getProductosPorCategoria(categoriaId: number) {
    const categoria = await this.categoriaRepository.findOne({
      where: { id: categoriaId, activa: true },
    });

    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }

    const productos = await this.productoRepository.find({
      where: { 
        categoriaId, 
        disponible: true 
      },
      order: { 
        enTendencia: 'DESC',
        esNuevo: 'DESC',
        nombre: 'ASC' 
      },
    });

    return {
      categoria,
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        imagen: p.imagenPrincipal,
        esNuevo: p.esNuevo,
        enTendencia: p.enTendencia,
        tiempoPreparacion: p.tiempoPreparacion,
      })),
    };
  }
}