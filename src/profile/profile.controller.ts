import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import {
  UpdateProfileDto,
  CreateDireccionDto,
  CreateMetodoPagoDto,
  AddCondicionSaludDto,
} from '../auth/dto/profile.dto';

// Configuración para guardar la imagen localmente en /uploads
const storageConfig = diskStorage({
  destination: './uploads', // Carpeta donde se guardarán las fotos
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `foto-${uniqueSuffix}${ext}`);
  },
});

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ============ PERFIL ============
  @Get()
  async getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.userId);
  }

  @Put()
  async updateProfile(@Request() req, @Body() updateData: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, updateData);
  }

  // Subir o actualizar foto de perfil
  @Put('foto')
  @UseInterceptors(FileInterceptor('fotoPerfil', { storage: storageConfig }))
  async updateFotoPerfil(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.profileService.updateFotoPerfil(req.user.userId, file);
  }

  // ============ DIRECCIONES ============
  @Get('direcciones')
  async getDirecciones(@Request() req) {
    return this.profileService.getDirecciones(req.user.userId);
  }

  @Post('direcciones')
  async createDireccion(@Request() req, @Body() createData: CreateDireccionDto) {
    return this.profileService.createDireccion(req.user.userId, createData);
  }

  @Put('direcciones/:id')
  async updateDireccion(
    @Request() req,
    @Param('id') id: number,
    @Body() updateData: CreateDireccionDto,
  ) {
    return this.profileService.updateDireccion(req.user.userId, id, updateData);
  }

  @Delete('direcciones/:id')
  async deleteDireccion(@Request() req, @Param('id') id: number) {
    return this.profileService.deleteDireccion(req.user.userId, id);
  }

  // ============ MÉTODOS DE PAGO ============
  @Get('metodos-pago')
  async getMetodosPago(@Request() req) {
    return this.profileService.getMetodosPago(req.user.userId);
  }

  @Post('metodos-pago')
  async createMetodoPago(@Request() req, @Body() createData: CreateMetodoPagoDto) {
    return this.profileService.createMetodoPago(req.user.userId, createData);
  }

  @Put('metodos-pago/:id')
  async updateMetodoPago(
    @Request() req,
    @Param('id') id: number,
    @Body() updateData: CreateMetodoPagoDto,
  ) {
    return this.profileService.updateMetodoPago(req.user.userId, id, updateData);
  }

  @Delete('metodos-pago/:id')
  async deleteMetodoPago(@Request() req, @Param('id') id: number) {
    return this.profileService.deleteMetodoPago(req.user.userId, id);
  }

  // ============ CONDICIONES DE SALUD ============
  @Get('condiciones-salud')
  async getCondicionesSalud() {
    return this.profileService.getCondicionesSalud();
  }

  @Get('mis-condiciones')
  async getClienteCondiciones(@Request() req) {
    return this.profileService.getClienteCondiciones(req.user.userId);
  }

  @Post('mis-condiciones')
  async addCondicionesSalud(@Request() req, @Body() data: AddCondicionSaludDto) {
    return this.profileService.addCondicionesSalud(req.user.userId, data);
  }
}
