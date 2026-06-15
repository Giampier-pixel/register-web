import { descargarArchivo, http } from './client';
import type {
  FiltrosTarjetas,
  Paginado,
  Rol,
  Tarjeta,
  TarjetaInput,
  Usuario,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    http.post<{ accessToken: string; user: Usuario }>('/auth/login', {
      email,
      password,
    }),
  me: () => http.get<Usuario>('/auth/me'),
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    http.patch<{ message: string }>('/auth/password', {
      passwordActual,
      passwordNueva,
    }),
};

export const usuariosApi = {
  listar: () => http.get<Usuario[]>('/users'),
  crear: (datos: {
    nombre: string;
    email: string;
    password: string;
    rol: Rol;
  }) => http.post<Usuario>('/users', datos),
  editar: (
    id: string,
    datos: Partial<{
      nombre: string;
      email: string;
      password: string;
      rol: Rol;
    }>,
  ) => http.patch<Usuario>(`/users/${id}`, datos),
  desactivar: (id: string) => http.patch<Usuario>(`/users/${id}/deactivate`),
  activar: (id: string) => http.patch<Usuario>(`/users/${id}/activate`),
};

export const tarjetasApi = {
  listar: (filtros: FiltrosTarjetas) => {
    const params = new URLSearchParams();
    params.set('page', String(filtros.page));
    params.set('limit', String(filtros.limit));
    if (filtros.search?.trim()) params.set('search', filtros.search.trim());
    if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.activa) params.set('activa', filtros.activa);
    return http.get<Paginado<Tarjeta>>(`/tarjetas?${params.toString()}`);
  },
  detalle: (id: string) => http.get<Tarjeta>(`/tarjetas/${id}`),
  crear: (datos: TarjetaInput) => http.post<Tarjeta>('/tarjetas', datos),
  editar: (id: string, datos: Partial<TarjetaInput>) =>
    http.patch<Tarjeta>(`/tarjetas/${id}`, datos),
  desactivar: (id: string) => http.delete<Tarjeta>(`/tarjetas/${id}`),
  activar: (id: string) => http.patch<Tarjeta>(`/tarjetas/${id}/activate`),
  descargarPdf: (id: string, folio: number) =>
    descargarArchivo(`/tarjetas/${id}/pdf`, `tarjeta-${folio}.pdf`),
};
