import { AreaUsuario } from './enums';

// Contratos de autenticacion (Documento 010 seccion 2, Documento 011 seccion 4).
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    area: AreaUsuario;
  };
}

// Forma del claim embebido en el JWT (Documento 011, seccion 4).
export interface JwtClaims {
  sub: string; // usuario.id
  area: AreaUsuario;
}
