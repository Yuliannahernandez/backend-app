import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async getPerfil(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
      relations: ['usuario'],
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.usuario?.correo,
      telefono: cliente.telefono,
      edad: cliente.edad,
      fechaNacimiento: cliente.fechaNacimiento,
      puntosLealtad: cliente.puntosLealtad || 0,
      fotoPerfil: cliente.fotoPerfil,
      idioma: cliente.idioma,
    };
  }

  async actualizarPerfil(usuarioId: number, data: any) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Actualizar campos
    if (data.nombre !== undefined) cliente.nombre = data.nombre;
    if (data.apellido !== undefined) cliente.apellido = data.apellido;
    if (data.telefono !== undefined) cliente.telefono = data.telefono;
    if (data.edad !== undefined) cliente.edad = data.edad;
    if (data.fechaNacimiento !== undefined) {
      cliente.fechaNacimiento = new Date(data.fechaNacimiento);
    }

    await this.clienteRepository.save(cliente);

    return this.getPerfil(usuarioId);
  }

  async getClienteByUsuarioId(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }
}