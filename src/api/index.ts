import { descargarArchivo, http } from './client';
import type {
  FichaSocial,
  FichaSocialInput,
  FiltrosFichas,
  Paginado,
  PreviewResultado,
  Rol,
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

export const fichasApi = {
  listar: (filtros: FiltrosFichas) => {
    const params = new URLSearchParams();
    params.set('page', String(filtros.page));
    params.set('limit', String(filtros.limit));
    if (filtros.search?.trim()) params.set('search', filtros.search.trim());
    if (filtros.categoria) params.set('categoria', filtros.categoria);
    if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.activa) params.set('activa', filtros.activa);
    return http.get<Paginado<FichaSocial>>(`/fichas?${params.toString()}`);
  },
  detalle: (id: string) => http.get<FichaSocial>(`/fichas/${id}`),
  crear: (datos: FichaSocialInput) => http.post<FichaSocial>('/fichas', datos),
  editar: (id: string, datos: Partial<FichaSocialInput>) =>
    http.patch<FichaSocial>(`/fichas/${id}`, datos),
  desactivar: (id: string) => http.delete<FichaSocial>(`/fichas/${id}`),
  activar: (id: string) => http.patch<FichaSocial>(`/fichas/${id}/activate`),
  previewPuntaje: (payload: Record<string, unknown>) =>
    http.post<PreviewResultado>('/fichas/preview-puntaje', payload),
  descargarPdf: (id: string, folio: number) =>
    descargarArchivo(`/fichas/${id}/pdf`, `ficha-${folio}.pdf`),
};
