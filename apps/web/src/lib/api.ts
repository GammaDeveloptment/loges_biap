import type {
  ApiErrorBody,
  AreaUsuario,
  LoginRequest,
  LoginResponse,
  NivelConfianza,
  TipoFuente,
} from '@loges-biap/shared-types';
import { obtenerSesion } from './session';

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
  conAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (conAuth) {
    const sesion = obtenerSesion();
    if (sesion) {
      headers.Authorization = `Bearer ${sesion.accessToken}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body?.error?.codigo ?? 'ERROR_DESCONOCIDO',
      body?.error?.mensaje ?? 'Ocurrio un error inesperado.',
      body?.error?.detalle,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function login(credenciales: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  });
}

// --- Documento 010, seccion 4.3 (Fuentes) ---

export interface Fuente {
  id: string;
  nombre: string;
  tipo: TipoFuente;
  pais: string;
  urlBase: string | null;
  nivelConfianzaBase: NivelConfianza;
  terminosUsoVerificados: boolean;
  activa: boolean;
  aprobadoPor: string | null;
  fechaAprobacionLegal: string | null;
  referenciaLegal: string | null;
  fechaAlta: string;
}

export interface CrearFuenteInput {
  nombre: string;
  tipo: TipoFuente;
  pais: string;
  urlBase?: string;
  nivelConfianzaBase: NivelConfianza;
}

export interface AprobarFuenteInput {
  terminosUsoVerificados: boolean;
  aprobadoPor: string;
  fechaAprobacionLegal: string;
  referenciaLegal: string;
  activa: boolean;
}

export function listarFuentes(): Promise<Fuente[]> {
  return request<Fuente[]>('/fuentes', {}, true);
}

export function crearFuente(input: CrearFuenteInput): Promise<Fuente> {
  return request<Fuente>('/fuentes', { method: 'POST', body: JSON.stringify(input) }, true);
}

export function actualizarFuente(id: string, input: Partial<AprobarFuenteInput>): Promise<Fuente> {
  return request<Fuente>(`/fuentes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, true);
}

// --- Documento 010, seccion 4.4 (Ejecuciones de Agente) ---

export interface EjecucionAgente {
  id: string;
  tipoTarea: string;
  estado: string;
  resultadoResumen: string | null;
  colaJobId: string | null;
  fechaInicio: string;
  fechaFin: string | null;
}

export function listarEjecucionesAgente(): Promise<EjecucionAgente[]> {
  return request<EjecucionAgente[]>('/ejecuciones-agente', {}, true);
}

export function dispararEjecucion(
  tipoTarea: string,
  criterios: Record<string, unknown> = {},
): Promise<EjecucionAgente> {
  return request<EjecucionAgente>(
    '/ejecuciones-agente',
    { method: 'POST', body: JSON.stringify({ tipoTarea, criterios }) },
    true,
  );
}

// Documento 009, seccion 4: la tarea corre en segundo plano (cola de
// BullMQ) - esto espera a que termine, consultando el listado cada segundo,
// para poder refrescar la pantalla y mostrar el resultado.
export async function esperarEjecucion(
  id: string,
  { intervaloMs = 1200, maxIntentos = 30 }: { intervaloMs?: number; maxIntentos?: number } = {},
): Promise<EjecucionAgente | null> {
  for (let intento = 0; intento < maxIntentos; intento++) {
    const ejecuciones = await listarEjecucionesAgente();
    const encontrada = ejecuciones.find((e) => e.id === id);
    if (encontrada && (encontrada.estado === 'completado' || encontrada.estado === 'fallido')) {
      return encontrada;
    }
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  return null;
}

// --- Documento 010, seccion 4.6 (Usuarios) ---

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  area: AreaUsuario;
  activo: boolean;
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  area: AreaUsuario;
}

export function listarUsuarios(): Promise<Usuario[]> {
  return request<Usuario[]>('/usuarios', {}, true);
}

export function crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
  return request<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(input) }, true);
}

// --- Documento 010, seccion 4.1 (Empresas) ---

export interface DatoTrazable {
  valor: string;
  fuente: { id: string; nombre: string; tipo: string };
  nivelConfianza: NivelConfianza;
  fechaVerificacion: string;
}

export interface EmpresaResumen {
  id: string;
  nombreLegal: string;
  pais: string;
  sector: string | null;
  nivelConfianzaGeneral: NivelConfianza | null;
  fechaDescubrimiento: string;
  roles: { rol: string }[];
  proveedorPerfil: { estadoEvaluacion: string } | null;
  competidorPerfil: { tipo: string; fechaUltimoMonitoreo: string | null } | null;
}

export interface FichaEmpresa {
  id: string;
  nombreLegal: string;
  nombreComercial: string | null;
  pais: string;
  identificadorFiscal: string | null;
  sector: string | null;
  estado: string;
  nivelConfianzaGeneral: NivelConfianza | null;
  fechaDescubrimiento: string;
  fechaUltimaVerificacion: string | null;
  roles: string[];
  atributos: Record<string, DatoTrazable>;
  contactos: { id: string; nombre: string; cargo: string | null; email: string | null; telefono: string | null }[];
  registrosComercioExterior: {
    id: string;
    tipoOperacion: string;
    productoDescripcion: string;
    paisOrigen: string;
    paisDestino: string;
    nivelConfianza: NivelConfianza;
    fuente: { nombre: string };
  }[];
  interaccionesRecientes: { id: string; tipoAccion: string; comentario: string | null; fecha: string; usuario: { nombre: string } }[];
  proveedorPerfil: {
    tipoServicio: string;
    zonaCobertura: string | null;
    estadoEvaluacion: string;
    fechaEvaluacion: string | null;
  } | null;
  competidorPerfil: {
    tipo: string;
    coberturaGeografica: string | null;
    fechaUltimoMonitoreo: string | null;
    cambios: { id: string; tipoCambio: string; descripcion: string; fechaDeteccion: string }[];
  } | null;
}

export function listarEmpresas(params: { rol?: string; sector?: string; pais?: string; limite?: number }) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as string[][],
  );
  return request<{ datos: EmpresaResumen[]; siguienteCursor: string | null }>(
    `/empresas?${qs.toString()}`,
    {},
    true,
  );
}

export function obtenerFichaEmpresa(id: string): Promise<FichaEmpresa> {
  return request<FichaEmpresa>(`/empresas/${id}`, {}, true);
}

export function crearInteraccion(
  empresaId: string,
  input: { tipoAccion: string; comentario?: string },
): Promise<unknown> {
  return request(`/empresas/${empresaId}/interacciones`, { method: 'POST', body: JSON.stringify(input) }, true);
}

export function actualizarUsuario(
  id: string,
  input: Partial<Pick<Usuario, 'area' | 'activo'>>,
): Promise<Usuario> {
  return request<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, true);
}
