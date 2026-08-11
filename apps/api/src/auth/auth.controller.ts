import { Body, Controller, Ip, Post } from '@nestjs/common';
import { LoginResponse } from '@loges-biap/shared-types';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

// Documento 010, seccion 2: POST /api/v1/auth/login es el unico endpoint de
// autenticacion para personas. Los tokens de integracion (CRM/ERP, Documento
// 011 seccion 2.2) no pasan por aqui.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Ip() ip: string): Promise<LoginResponse> {
    return this.authService.login(dto, ip);
  }
}
