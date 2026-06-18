/** Tipos espejo de la API FichaSocial (valores calcan src/fichas/enums/ficha.enums.ts). */

export type Rol = 'ADMIN' | 'TRABAJADOR_SOCIAL';

export interface Usuario {
  id: string; nombre: string; email: string; rol: Rol; activo: boolean;
  createdAt: string; updatedAt: string;
}

export const GRADOS_INSTRUCCION = ['Iletrado', 'Primaria', 'Secundaria', 'Superior Técnico', 'Superior Universitario'] as const;
export const ESTADOS_CIVILES = ['Soltero', 'Conviviente/Casado', 'Viudo', 'Divorciado/Separado'] as const;
export const ASEGURAMIENTOS = ['Sí', 'No', 'EsSalud', 'Otro'] as const;
export const CONDICIONES_OCUPACIONALES = ['Profesional/Independiente', 'Profesional/Dependiente', 'Técnico Mando Medio', 'Trabajador Informal', 'Eventual', 'Pensionista', 'Su casa', 'Permanente', 'Sin ocupación'] as const;
export const GRADOS_DEPENDENCIA = ['Hasta 3 miembros', 'Más de 3 miembros'] as const;
export const TRAMOS_INGRESO = ['Ninguna', 'Menos de 1 SMV', 'De 1 a 2 SMV', 'De 2 a 3 SMV', 'De 3 a 4 SMV', 'Más de SMV'] as const;
export const TENENCIAS = ['Propia', 'Alquilada', 'Invasión', 'Guardianía', 'Alojado'] as const;
export const MATERIALES = ['Noble/Acabado', 'Noble sin acabar', 'Mixto', 'Rústico', 'Precario'] as const;
export const SERVICIOS_BASICOS = ['Completo', 'Parcial', 'Sin servicios básicos'] as const;
export const EQUIPAMIENTOS = ['No cuenta con artefactos', '1 a 2', '3 a más'] as const;
export const FACTORES_RIESGO = ['Niños Desnutridos', 'Tuberculosis', 'ETS-Sida', 'Incapacidad Física o Mental', 'Antecedentes Penales', 'Fármaco Dependencia', 'Abandono Familiar', 'Violencia Familiar', 'Prostitución'] as const;
export const CATEGORIAS = ['A', 'B', 'C', 'Z'] as const;

export type GradoInstruccion = (typeof GRADOS_INSTRUCCION)[number];
export type EstadoCivil = (typeof ESTADOS_CIVILES)[number];
export type Aseguramiento = (typeof ASEGURAMIENTOS)[number];
export type CondicionOcupacional = (typeof CONDICIONES_OCUPACIONALES)[number];
export type GradoDependencia = (typeof GRADOS_DEPENDENCIA)[number];
export type TramoIngreso = (typeof TRAMOS_INGRESO)[number];
export type Tenencia = (typeof TENENCIAS)[number];
export type Material = (typeof MATERIALES)[number];
export type ServiciosBasicos = (typeof SERVICIOS_BASICOS)[number];
export type Equipamiento = (typeof EQUIPAMIENTOS)[number];
export type FactorRiesgo = (typeof FACTORES_RIESGO)[number];
export type Categoria = (typeof CATEGORIAS)[number];

export interface Paciente {
  apellidoPaterno: string; apellidoMaterno: string; nombres: string;
  nroHistoriaClinica?: string; procedencia: string; lugarNacimiento: string;
  fechaNacimiento: string; edad: number;
}
export interface PersonaAcompana { nombre?: string; direccion?: string; telefono?: string; }
export interface MiembroFamiliar {
  nombresApellidos: string; parentesco?: string; edad?: number; gradoInstruccion?: string;
  esAsegurado?: boolean; ocupacion?: string; ingreso?: number; observaciones?: string;
}
export interface IngresosGastos {
  ingresoFamiliar?: number; ayudasApoyos?: number; rentas?: number; otrosIngresos?: number;
  gastoAlimentacion?: number; gastoVivienda?: number; gastoMovilidad?: number; otrosGastos?: number;
}
export interface Vivienda {
  tenencia: Tenencia; materialConstruccion: Material;
  nroMiembrosHogar: number; nroAmbientesDormir: number; serviciosBasicos: ServiciosBasicos;
}
export interface Puntajes { puntajeBasico: number; puntajeEstudioSocial?: number; categoria: Categoria; }

export interface FichaSocial {
  id: string; nroFichaSocial: number; servicio?: string;
  paciente: Paciente;
  gradoInstruccion: GradoInstruccion; estadoCivil: EstadoCivil;
  aseguramiento: Aseguramiento; aseguramientoOtro?: string;
  ocupacion?: string; condicionOcupacional: CondicionOcupacional;
  direccion?: string; telefono?: string; personaAcompana?: PersonaAcompana;
  composicionFamiliar: MiembroFamiliar[]; gradoDependenciaEconomica: GradoDependencia;
  ingresosGastos?: IngresosGastos; tramoIngreso: TramoIngreso;
  vivienda: Vivienda; equipamientoHogar: Equipamiento;
  factoresRiesgoTexto?: string; factoresRiesgo: FactorRiesgo[];
  puntajes: Puntajes; trabajadoraSocial: string; fechaInscripcion: string;
  creadoPor: string; actualizadoPor?: string; activa: boolean;
  createdAt: string; updatedAt: string;
}

export interface FichaSocialInput {
  servicio?: string;
  paciente: Omit<Paciente, 'edad'> & { edad?: number };
  gradoInstruccion: GradoInstruccion; estadoCivil: EstadoCivil;
  aseguramiento: Aseguramiento; aseguramientoOtro?: string;
  ocupacion?: string; condicionOcupacional: CondicionOcupacional;
  direccion?: string; telefono?: string; personaAcompana?: PersonaAcompana;
  composicionFamiliar?: MiembroFamiliar[]; gradoDependenciaEconomica: GradoDependencia;
  ingresosGastos?: IngresosGastos; tramoIngreso: TramoIngreso;
  vivienda: Vivienda; equipamientoHogar: Equipamiento;
  factoresRiesgoTexto?: string; factoresRiesgo?: FactorRiesgo[];
  puntajeEstudioSocial?: number;
}

export interface PreviewResultado {
  puntajeBasico: number; categoria: Categoria; desglose: Record<string, number>;
}

export interface Paginado<T> {
  data: T[]; meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface FiltrosFichas {
  search?: string; categoria?: Categoria | ''; fechaDesde?: string; fechaHasta?: string;
  activa?: 'true' | 'false' | ''; page: number; limit: number;
}
