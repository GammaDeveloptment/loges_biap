import type { ApiErrorBody, LoginRequest, LoginResponse } from '@loges-biap/shared-types';

// El frontend nunca habla con la base de datos, solo con esta API (Documento
// 006; Documento 004, seccion 3).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
    public detalle?: unknown,
  ) {
    super(mensaje);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body?.error.codigo ?? 'ERROR_DESCONOCIDO',
      body?.error.mensaje ?? 'Ocurrio un error inesperado.',
      body?.error.detalle,
    );
  }

  return response.json() as Promise<T>;
}

export function login(credenciales: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  });
}
