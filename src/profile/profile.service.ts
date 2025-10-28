import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { Direccion } from '../entities/direccion.entity';
import { MetodoPago } from '../entities/metodopago.entity';
import { CondicionSalud } from '../entities/condicionsalud.entity';
import { UpdateProfileDto, CreateDireccionDto, CreateMetodoPagoDto, AddCondicionSaludDto } from '../auth/dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Direccion)
    private direccionRepository: Repository<Direccion>,
    @InjectRepository(MetodoPago)
    private metodoPagoRepository: Repository<MetodoPago>,
    @InjectRepository(CondicionSalud)
    private condicionSaludRepository: Repository<CondicionSalud>,
  ) {}

  // ============ PERFIL ============
  async getProfile(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
      relations: ['usuario'],
    });

    if (!cliente) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      edad: cliente.edad,
      telefono: cliente.telefono,
      correo: cliente.usuario.correo,
      idioma: cliente.idioma,
      puntosLealtad: cliente.puntosLealtad,
      fotoPerfil: cliente.fotoPerfil,
      fechaNacimiento: cliente.fechaNacimiento,
    };
  }

  async updateProfile(usuarioId: number, updateData: UpdateProfileDto) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Perfil no encontrado');
    }

    Object.assign(cliente, updateData);
    await this.clienteRepository.save(cliente);

    return {
      message: 'Perfil actualizado exitosamente',
      data: cliente,
    };
  }

  async updateFotoPerfil(usuarioId: number, file: Express.Multer.File) {
  const cliente = await this.clienteRepository.findOne({ where: { usuarioId } });
  if (!cliente) throw new NotFoundException('Cliente no encontrado');

  // Aquí guardas la ruta o URL donde almacenas la imagen
  const imageUrl = file.filename;
  cliente.fotoPerfil = imageUrl;

  await this.clienteRepository.save(cliente);

  return {
    message: 'Foto actualizada correctamente',
    fotoPerfil: imageUrl,
  };
}


  // ============ DIRECCIONES ============
  async getDirecciones(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.direccionRepository.find({
      where: { clienteId: cliente.id, activa: true },
      order: { esPrincipal: 'DESC', fechaCreacion: 'DESC' },
    });
  }

  async createDireccion(usuarioId: number, createData: CreateDireccionDto) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Si es dirección principal, desmarcar las demás
    if (createData.esPrincipal) {
      await this.direccionRepository.update(
        { clienteId: cliente.id },
        { esPrincipal: false },
      );
    }

    const direccion = this.direccionRepository.create({
      ...createData,
      clienteId: cliente.id,
    });

    await this.direccionRepository.save(direccion);

    return {
      message: 'Dirección agregada exitosamente',
      data: direccion,
    };
  }

  async updateDireccion(usuarioId: number, direccionId: number, updateData: CreateDireccionDto) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const direccion = await this.direccionRepository.findOne({
      where: { id: direccionId, clienteId: cliente.id },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }

    // Si se marca como principal, desmarcar las demás
    if (updateData.esPrincipal) {
      await this.direccionRepository.update(
        { clienteId: cliente.id },
        { esPrincipal: false },
      );
    }

    Object.assign(direccion, updateData);
    await this.direccionRepository.save(direccion);

    return {
      message: 'Dirección actualizada exitosamente',
      data: direccion,
    };
  }

  async deleteDireccion(usuarioId: number, direccionId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const result = await this.direccionRepository.update(
      { id: direccionId, clienteId: cliente.id },
      { activa: false },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return {
      message: 'Dirección eliminada exitosamente',
    };
  }

  // ============ MÉTODOS DE PAGO ============
async getMetodosPago(usuarioId: number) {
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  return this.metodoPagoRepository.find({
    where: { clienteId: cliente.id, activo: true },
    order: { esPrincipal: 'DESC', fechaCreacion: 'DESC' },
  });
}

async createMetodoPago(usuarioId: number, createData: CreateMetodoPagoDto) {
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  // Si es método principal, desmarcar los demás
  if (createData.esPrincipal) {
    await this.metodoPagoRepository.update(
      { clienteId: cliente.id },
      { esPrincipal: false },
    );
  }

  const metodoPago = this.metodoPagoRepository.create({
    ...createData,
    clienteId: cliente.id,
  });

  await this.metodoPagoRepository.save(metodoPago);

  return {
    message: 'Método de pago agregado exitosamente',
    data: metodoPago,
  };
}

async updateMetodoPago(usuarioId: number, metodoPagoId: number, updateData: CreateMetodoPagoDto) {
  const cliente = await this.clienteRepository.findOne({
    where: { usuarioId },
  });

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  const metodoPago = await this.metodoPagoRepository.findOne({
    where: { id: metodoPagoId, clienteId: cliente.id, activo: true },
  });

  if (!metodoPago) {
    throw new NotFoundException('Método de pago no encontrado');
  }

  // Si se marca como principal, desmarcar los demás
  if (updateData.esPrincipal) {
    await this.metodoPagoRepository.update(
      { clienteId: cliente.id },
      { esPrincipal: false },
    );
  }

  Object.assign(metodoPago, updateData);
  await this.metodoPagoRepository.save(metodoPago);

  return {
    message: 'Método de pago actualizado exitosamente',
    data: metodoPago,
  };
}

  async deleteMetodoPago(usuarioId: number, metodoPagoId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const result = await this.metodoPagoRepository.update(
      { id: metodoPagoId, clienteId: cliente.id },
      { activo: false },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    return {
      message: 'Método de pago eliminado exitosamente',
    };
  }

  // ============ CONDICIONES DE SALUD ============
  async getCondicionesSalud() {
    return this.condicionSaludRepository.find();
  }

  async getClienteCondiciones(usuarioId: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const result = await this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente_condiciones', 'cc', 'cc.cliente_id = cliente.id')
      .leftJoinAndSelect('condiciones_salud', 'cs', 'cs.id = cc.condicion_id')
      .where('cliente.id = :clienteId', { clienteId: cliente.id })
      .getRawMany();

    return result.map(r => ({
      id: r.cs_id,
      nombre: r.cs_nombre,
      descripcion: r.cs_descripcion,
    })).filter(c => c.id);
  }

  async addCondicionesSalud(usuarioId: number, data: AddCondicionSaludDto) {
    const cliente = await this.clienteRepository.findOne({
      where: { usuarioId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Eliminar condiciones anteriores
    await this.clienteRepository.query(
      'DELETE FROM cliente_condiciones WHERE cliente_id = ?',
      [cliente.id],
    );

    // Agregar nuevas condiciones
    if (data.condicionIds.length > 0) {
      const values = data.condicionIds.map(id => `(${cliente.id}, ${id})`).join(',');
      await this.clienteRepository.query(
        `INSERT INTO cliente_condiciones (cliente_id, condicion_id) VALUES ${values}`,
      );
    }

    return {
      message: 'Condiciones de salud actualizadas exitosamente',
    };
  }
}