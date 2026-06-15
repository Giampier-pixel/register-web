/** Tipos espejo de la API (campos de dominio en español, como la ficha física). */

export type Rol = 'ADMIN' | 'TRABAJADOR_SOCIAL';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GRADOS_INSTRUCCION = [
  'Iletrado',
  'Primaria',
  'Secundaria Completa',
  'Superior Técnico',
  'Superior Universidad',
] as const;

export const ESTADOS_CIVILES = [
  'Soltero',
  'Conviviente',
  'Casado',
  'Viudo',
  'Divorciado / Separado',
] as const;

export const OCUPACIONES = [
  'Trabajador Profesional / Independiente',
  'Trabajador Profesional Dependiente',
  'Técnico / Mando Medio',
  'Trabajador Informal',
  'Pensionista',
  'Su Casa',
  'Sin Ocupación',
  'Eventual',
  'Permanente',
] as const;

export const VIVIENDAS = [
  'Propia',
  'Alquilada',
  'Invasión',
  'Guardianía',
  'Alojado',
] as const;

export const SERVICIOS_BASICOS = [
  'Completo',
  'Parcial',
  'Sin Servicios Básicos',
] as const;

export const SALUD_FAMILIAR = [
  'Desnutrición',
  'TBC',
  'ETS / SIDA',
  'Incapacidad Física / Mental',
  'Prostitución',
  'Antecedentes Penales',
  'Fármaco-Dependencia',
  'Abandono Familiar',
  'Violencia Familiar',
] as const;

export type GradoInstruccion = (typeof GRADOS_INSTRUCCION)[number];
export type EstadoCivil = (typeof ESTADOS_CIVILES)[number];
export type Ocupacion = (typeof OCUPACIONES)[number];
export type Vivienda = (typeof VIVIENDAS)[number];
export type ServiciosBasicos = (typeof SERVICIOS_BASICOS)[number];
export type SaludFamiliar = (typeof SALUD_FAMILIAR)[number];

export interface Paciente {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  nroHistoriaClinica?: string;
  procedencia: string;
  transferido?: string;
  lugarNacimiento: string;
  fechaNacimiento: string;
  edad: number;
}

export interface Socioeconomico {
  ingresoEconomico: number;
  gradoDependencia: number;
  direccion: string;
  distrito: string;
}

export interface FamiliarConyuge {
  nombre?: string;
  edad?: number;
  gradoInstruccion?: string;
  telefono?: string;
  ocupacion?: string;
  centroTrabajo?: string;
}

export interface DatosFamiliares {
  numeroHermanosHijos?: string;
  observaciones?: string;
}

export interface Tarjeta {
  id: string;
  nroTarjetaSocial: number;
  paciente: Paciente;
  gradoInstruccion: GradoInstruccion;
  estadoCivil: EstadoCivil;
  ocupacion: Ocupacion;
  socioeconomico: Socioeconomico;
  vivienda: Vivienda;
  serviciosBasicos: ServiciosBasicos;
  padreConyuge?: FamiliarConyuge;
  madreConyuge?: FamiliarConyuge;
  datosFamiliares?: DatosFamiliares;
  saludFamiliar: SaludFamiliar[];
  dx?: string;
  preDiagnosticoSocial: string;
  asistenteSocial: string;
  fechaInscripcion: string;
  creadoPor: string;
  actualizadoPor?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload de creación/edición (lo que la API espera). */
export interface TarjetaInput {
  paciente: Omit<Paciente, 'edad'> & { edad?: number };
  gradoInstruccion: GradoInstruccion;
  estadoCivil: EstadoCivil;
  ocupacion: Ocupacion;
  socioeconomico: Socioeconomico;
  vivienda: Vivienda;
  serviciosBasicos: ServiciosBasicos;
  padreConyuge?: FamiliarConyuge;
  madreConyuge?: FamiliarConyuge;
  datosFamiliares?: DatosFamiliares;
  saludFamiliar?: SaludFamiliar[];
  dx?: string;
  preDiagnosticoSocial: string;
}

export interface Paginado<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FiltrosTarjetas {
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  activa?: 'true' | 'false' | '';
  page: number;
  limit: number;
}
