import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fichasApi } from '../api';
import { ApiError } from '../api/client';
import {
  ASEGURAMIENTOS,
  CONDICIONES_OCUPACIONALES,
  EQUIPAMIENTOS,
  ESTADOS_CIVILES,
  FACTORES_RIESGO,
  GRADOS_DEPENDENCIA,
  GRADOS_INSTRUCCION,
  MATERIALES,
  SERVICIOS_BASICOS,
  TENENCIAS,
  TRAMOS_INGRESO,
  type FichaSocial,
  type FichaSocialInput,
  type FactorRiesgo,
  type PreviewResultado,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Cargando } from '../components/Cargando';
import { Icono } from '../components/Icono';

/** Zona horaria del hospital (Perú no tiene horario de verano). */
const OFFSET_PERU = '-05:00';

interface ValoresMiembro {
  nombresApellidos: string;
  parentesco: string;
  edad: string;
  gradoInstruccion: string;
  esAsegurado: boolean;
  ocupacion: string;
  ingreso: string;
  observaciones: string;
}

interface ValoresFicha {
  servicio: string;
  nroHistoriaClinica: string;
  // I. Datos generales
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  lugarNacimiento: string;
  fechaNacimiento: string;
  edad: string;
  gradoInstruccion: string;
  estadoCivil: string;
  aseguramiento: string;
  aseguramientoOtro: string;
  procedencia: string;
  ocupacion: string;
  condicionOcupacional: string;
  direccion: string;
  telefono: string;
  acompananteNombre: string;
  acompananteDireccion: string;
  acompananteTelefono: string;
  // II. Composición familiar
  composicionFamiliar: ValoresMiembro[];
  gradoDependenciaEconomica: string;
  // III. Ingreso y gastos
  ingresoFamiliar: string;
  ayudasApoyos: string;
  rentas: string;
  otrosIngresos: string;
  gastoAlimentacion: string;
  gastoVivienda: string;
  gastoMovilidad: string;
  otrosGastos: string;
  tramoIngreso: string;
  // IV. Vivienda
  tenencia: string;
  materialConstruccion: string;
  nroMiembrosHogar: string;
  nroAmbientesDormir: string;
  serviciosBasicos: string;
  // V. Equipamiento
  equipamientoHogar: string;
  // VI. Factores de riesgo
  factoresRiesgoTexto: string;
  factoresRiesgo: FactorRiesgo[];
  puntajeEstudioSocial: string;
}

const MIEMBRO_VACIO: ValoresMiembro = {
  nombresApellidos: '',
  parentesco: '',
  edad: '',
  gradoInstruccion: '',
  esAsegurado: false,
  ocupacion: '',
  ingreso: '',
  observaciones: '',
};

const VALORES_INICIALES: ValoresFicha = {
  servicio: '',
  nroHistoriaClinica: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombres: '',
  lugarNacimiento: '',
  fechaNacimiento: '',
  edad: '',
  gradoInstruccion: '',
  estadoCivil: '',
  aseguramiento: '',
  aseguramientoOtro: '',
  procedencia: '',
  ocupacion: '',
  condicionOcupacional: '',
  direccion: '',
  telefono: '',
  acompananteNombre: '',
  acompananteDireccion: '',
  acompananteTelefono: '',
  composicionFamiliar: [],
  gradoDependenciaEconomica: '',
  ingresoFamiliar: '',
  ayudasApoyos: '',
  rentas: '',
  otrosIngresos: '',
  gastoAlimentacion: '',
  gastoVivienda: '',
  gastoMovilidad: '',
  otrosGastos: '',
  tramoIngreso: '',
  tenencia: '',
  materialConstruccion: '',
  nroMiembrosHogar: '',
  nroAmbientesDormir: '',
  serviciosBasicos: '',
  equipamientoHogar: '',
  factoresRiesgoTexto: '',
  factoresRiesgo: [],
  puntajeEstudioSocial: '',
};

const limpiar = (v: string | undefined): string | undefined =>
  v && v.trim() !== '' ? v.trim() : undefined;

const num = (v: string | number | undefined): number | undefined =>
  v === '' || v === undefined || v === null ? undefined : Number(v);

/** Calcula la edad anclada al día peruano, igual que `calcularEdad` del backend. */
function calcularEdadPeru(fechaNacimiento: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) return undefined;
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00.000${OFFSET_PERU}`);
  const hoyPeru = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }),
  );
  let edad = hoyPeru.getFullYear() - nacimiento.getUTCFullYear();
  const mes = hoyPeru.getMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoyPeru.getDate() < nacimiento.getUTCDate())) {
    edad--;
  }
  return Math.max(0, edad);
}

function aPayload(v: ValoresFicha): FichaSocialInput {
  const personaAcompana = {
    nombre: limpiar(v.acompananteNombre),
    direccion: limpiar(v.acompananteDireccion),
    telefono: limpiar(v.acompananteTelefono),
  };
  const ingresosGastos = {
    ingresoFamiliar: num(v.ingresoFamiliar),
    ayudasApoyos: num(v.ayudasApoyos),
    rentas: num(v.rentas),
    otrosIngresos: num(v.otrosIngresos),
    gastoAlimentacion: num(v.gastoAlimentacion),
    gastoVivienda: num(v.gastoVivienda),
    gastoMovilidad: num(v.gastoMovilidad),
    otrosGastos: num(v.otrosGastos),
  };
  return {
    servicio: limpiar(v.servicio),
    paciente: {
      apellidoPaterno: v.apellidoPaterno.trim(),
      apellidoMaterno: v.apellidoMaterno.trim(),
      nombres: v.nombres.trim(),
      nroHistoriaClinica: limpiar(v.nroHistoriaClinica),
      procedencia: v.procedencia.trim(),
      lugarNacimiento: v.lugarNacimiento.trim(),
      fechaNacimiento: v.fechaNacimiento,
      edad: num(v.edad),
    },
    gradoInstruccion: v.gradoInstruccion as FichaSocialInput['gradoInstruccion'],
    estadoCivil: v.estadoCivil as FichaSocialInput['estadoCivil'],
    aseguramiento: v.aseguramiento as FichaSocialInput['aseguramiento'],
    aseguramientoOtro: limpiar(v.aseguramientoOtro),
    ocupacion: limpiar(v.ocupacion),
    condicionOcupacional:
      v.condicionOcupacional as FichaSocialInput['condicionOcupacional'],
    direccion: limpiar(v.direccion),
    telefono: limpiar(v.telefono),
    personaAcompana: Object.values(personaAcompana).some(Boolean)
      ? personaAcompana
      : undefined,
    composicionFamiliar: (v.composicionFamiliar ?? [])
      .filter((m) => m.nombresApellidos?.trim())
      .map((m) => ({
        nombresApellidos: m.nombresApellidos.trim(),
        parentesco: limpiar(m.parentesco),
        edad: num(m.edad),
        gradoInstruccion: limpiar(m.gradoInstruccion),
        esAsegurado: !!m.esAsegurado,
        ocupacion: limpiar(m.ocupacion),
        ingreso: num(m.ingreso),
        observaciones: limpiar(m.observaciones),
      })),
    gradoDependenciaEconomica:
      v.gradoDependenciaEconomica as FichaSocialInput['gradoDependenciaEconomica'],
    ingresosGastos: Object.values(ingresosGastos).some((x) => x !== undefined)
      ? ingresosGastos
      : undefined,
    tramoIngreso: v.tramoIngreso as FichaSocialInput['tramoIngreso'],
    vivienda: {
      tenencia: v.tenencia,
      materialConstruccion: v.materialConstruccion,
      nroMiembrosHogar: num(v.nroMiembrosHogar),
      nroAmbientesDormir: num(v.nroAmbientesDormir),
      serviciosBasicos: v.serviciosBasicos,
    } as FichaSocialInput['vivienda'],
    equipamientoHogar: v.equipamientoHogar as FichaSocialInput['equipamientoHogar'],
    factoresRiesgoTexto: limpiar(v.factoresRiesgoTexto),
    factoresRiesgo: v.factoresRiesgo ?? [],
    puntajeEstudioSocial: num(v.puntajeEstudioSocial),
  };
}

function aValores(f: FichaSocial): ValoresFicha {
  return {
    servicio: f.servicio ?? '',
    nroHistoriaClinica: f.paciente.nroHistoriaClinica ?? '',
    apellidoPaterno: f.paciente.apellidoPaterno,
    apellidoMaterno: f.paciente.apellidoMaterno,
    nombres: f.paciente.nombres,
    lugarNacimiento: f.paciente.lugarNacimiento,
    fechaNacimiento: f.paciente.fechaNacimiento.slice(0, 10),
    edad: String(f.paciente.edad ?? ''),
    gradoInstruccion: f.gradoInstruccion,
    estadoCivil: f.estadoCivil,
    aseguramiento: f.aseguramiento,
    aseguramientoOtro: f.aseguramientoOtro ?? '',
    procedencia: f.paciente.procedencia,
    ocupacion: f.ocupacion ?? '',
    condicionOcupacional: f.condicionOcupacional,
    direccion: f.direccion ?? '',
    telefono: f.telefono ?? '',
    acompananteNombre: f.personaAcompana?.nombre ?? '',
    acompananteDireccion: f.personaAcompana?.direccion ?? '',
    acompananteTelefono: f.personaAcompana?.telefono ?? '',
    composicionFamiliar: (f.composicionFamiliar ?? []).map((m) => ({
      nombresApellidos: m.nombresApellidos,
      parentesco: m.parentesco ?? '',
      edad: m.edad !== undefined ? String(m.edad) : '',
      gradoInstruccion: m.gradoInstruccion ?? '',
      esAsegurado: !!m.esAsegurado,
      ocupacion: m.ocupacion ?? '',
      ingreso: m.ingreso !== undefined ? String(m.ingreso) : '',
      observaciones: m.observaciones ?? '',
    })),
    gradoDependenciaEconomica: f.gradoDependenciaEconomica,
    ingresoFamiliar: f.ingresosGastos?.ingresoFamiliar?.toString() ?? '',
    ayudasApoyos: f.ingresosGastos?.ayudasApoyos?.toString() ?? '',
    rentas: f.ingresosGastos?.rentas?.toString() ?? '',
    otrosIngresos: f.ingresosGastos?.otrosIngresos?.toString() ?? '',
    gastoAlimentacion: f.ingresosGastos?.gastoAlimentacion?.toString() ?? '',
    gastoVivienda: f.ingresosGastos?.gastoVivienda?.toString() ?? '',
    gastoMovilidad: f.ingresosGastos?.gastoMovilidad?.toString() ?? '',
    otrosGastos: f.ingresosGastos?.otrosGastos?.toString() ?? '',
    tramoIngreso: f.tramoIngreso,
    tenencia: f.vivienda.tenencia,
    materialConstruccion: f.vivienda.materialConstruccion,
    nroMiembrosHogar: String(f.vivienda.nroMiembrosHogar ?? ''),
    nroAmbientesDormir: String(f.vivienda.nroAmbientesDormir ?? ''),
    serviciosBasicos: f.vivienda.serviciosBasicos,
    equipamientoHogar: f.equipamientoHogar,
    factoresRiesgoTexto: f.factoresRiesgoTexto ?? '',
    factoresRiesgo: f.factoresRiesgo ?? [],
    puntajeEstudioSocial: f.puntajes?.puntajeEstudioSocial?.toString() ?? '',
  };
}

/** Valor de enum o undefined si está vacío (para el preview parcial). */
const enumOrUndef = (s: string | undefined): string | undefined =>
  s && s.trim() !== '' ? s : undefined;

/**
 * Payload LAXO para el preview en vivo: solo los campos puntuables, omitiendo
 * los enums sin elegir (JSON.stringify descarta los undefined, así el backend
 * los salta y devuelve el puntaje parcial en vez de un 400).
 */
function payloadPreview(v: ValoresFicha): Record<string, unknown> {
  const vivienda: Record<string, unknown> = {
    tenencia: enumOrUndef(v.tenencia),
    materialConstruccion: enumOrUndef(v.materialConstruccion),
    nroMiembrosHogar: num(v.nroMiembrosHogar),
    nroAmbientesDormir: num(v.nroAmbientesDormir),
    serviciosBasicos: enumOrUndef(v.serviciosBasicos),
  };
  return {
    edad: num(v.edad),
    gradoInstruccion: enumOrUndef(v.gradoInstruccion),
    estadoCivil: enumOrUndef(v.estadoCivil),
    aseguramiento: enumOrUndef(v.aseguramiento),
    condicionOcupacional: enumOrUndef(v.condicionOcupacional),
    gradoDependenciaEconomica: enumOrUndef(v.gradoDependenciaEconomica),
    tramoIngreso: enumOrUndef(v.tramoIngreso),
    vivienda: Object.values(vivienda).some((x) => x !== undefined)
      ? vivienda
      : undefined,
    equipamientoHogar: enumOrUndef(v.equipamientoHogar),
    factoresRiesgo: v.factoresRiesgo ?? [],
  };
}

/** Panel de puntaje en vivo: recalcula con debounce cada vez que cambia el form. */
function usePreviewPuntaje(valores: ValoresFicha): PreviewResultado | null {
  const [res, setRes] = useState<PreviewResultado | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      fichasApi
        .previewPuntaje(payloadPreview(valores))
        .then(setRes)
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(valores)]);

  return res;
}

export function FichaFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const [errorApi, setErrorApi] = useState<ApiError | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFicha>({ defaultValues: VALORES_INICIALES });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'composicionFamiliar',
  });

  const { data: existente, isPending: cargandoExistente } = useQuery({
    queryKey: ['ficha', id],
    queryFn: () => fichasApi.detalle(id!),
    enabled: editando,
  });

  useEffect(() => {
    if (existente) {
      reset(aValores(existente));
    }
  }, [existente, reset]);

  const fechaNacimiento = watch('fechaNacimiento');
  useEffect(() => {
    const edadCalculada = calcularEdadPeru(fechaNacimiento);
    if (edadCalculada !== undefined) {
      setValue('edad', String(edadCalculada));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaNacimiento]);

  const aseguramiento = watch('aseguramiento');
  const valoresActuales = watch();
  const preview = usePreviewPuntaje(valoresActuales);

  const guardar = useMutation({
    mutationFn: (valores: ValoresFicha) =>
      editando
        ? fichasApi.editar(id!, aPayload(valores))
        : fichasApi.crear(aPayload(valores)),
    onSuccess: async (ficha) => {
      await queryClient.invalidateQueries({ queryKey: ['fichas'] });
      await queryClient.invalidateQueries({ queryKey: ['ficha', ficha.id] });
      navigate(`/fichas/${ficha.id}`, {
        state: editando
          ? { mensaje: 'Cambios guardados correctamente.' }
          : {
              mensaje: `Ficha registrada con el folio Nº ${ficha.nroFichaSocial} · Categoría ${ficha.puntajes.categoria}.`,
            },
      });
    },
    onError: (err) => {
      setErrorApi(
        err instanceof ApiError ? err : new ApiError(0, 'No se pudo guardar'),
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  if (editando && cargandoExistente) {
    return <Cargando texto="Cargando ficha…" />;
  }

  const mensajeError = (campo: keyof typeof errors) => {
    const error = errors[campo];
    return typeof error?.message === 'string' ? (
      <span className="error">{error.message}</span>
    ) : null;
  };

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>{editando ? 'Editar ficha' : 'Nueva ficha'}</h1>
          <p className="subtitulo mt-0">
            {editando
              ? `Folio Nº ${existente?.nroFichaSocial ?? ''}`
              : 'Los campos marcados con * son obligatorios'}
          </p>
        </div>
        <Link
          to={editando ? `/fichas/${id}` : '/fichas'}
          className="btn btn--secundario"
        >
          <Icono nombre="volver" />
          Volver
        </Link>
      </div>

      {errorApi && (
        <div className="alerta alerta--error" role="alert" style={{ marginBottom: 16 }}>
          <Icono nombre="alerta" />
          <div>
            {errorApi.message}
            {errorApi.detalles.length > 0 && (
              <ul>
                {errorApi.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div
        className="panel"
        style={{
          position: 'sticky',
          top: 70,
          zIndex: 20,
          marginBottom: 16,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="dato dt" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--tinta-suave)' }}>
            Puntaje Básico (en vivo)
          </div>
          <div style={{ fontSize: 24, fontWeight: 650, fontFamily: 'var(--f-display)', color: 'var(--verde-oscuro)' }}>
            {preview ? preview.puntajeBasico : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--tinta-suave)' }}>
            Categoría
          </div>
          <div style={{ fontSize: 24, fontWeight: 650, fontFamily: 'var(--f-display)', color: 'var(--verde-oscuro)' }}>
            {preview?.categoria ?? '—'}
          </div>
        </div>
        {preview?.desglose && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', flex: 1 }}>
            {Object.entries(preview.desglose).map(([clave, valor]) => (
              <span key={clave} className="texto-suave" style={{ fontSize: 12.5 }}>
                {clave}: <strong>{valor}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <form
        className="ficha"
        onSubmit={(e) => {
          void handleSubmit((valores) => guardar.mutateAsync(valores))(e);
        }}
        noValidate
      >
        <div className="ficha__membrete">
          <div>
            <div className="linea-hospital">
              Hospital «Daniel A. Carrión» · Servicio de Trabajo Social
            </div>
            <h2>Ficha Social</h2>
          </div>
          <div className="folio-caja">
            <div className="rotulo">Nº Ficha Social</div>
            <div className="numero">
              {editando ? existente?.nroFichaSocial : 'auto'}
            </div>
          </div>
        </div>

        <div className="ficha__cuerpo">
          {/* Cabecera */}
          <fieldset className="seccion">
            <legend>Datos del Registro</legend>
            <div className="rejilla rejilla--3">
              <div className="campo">
                <label>Servicio</label>
                <input {...register('servicio')} />
              </div>
              <div className="campo">
                <label>Nº Historia clínica</label>
                <input {...register('nroHistoriaClinica')} />
              </div>
              {editando && (
                <div className="campo">
                  <label>Fecha de inscripción</label>
                  <input
                    disabled
                    value={
                      existente?.fechaInscripcion
                        ? existente.fechaInscripcion.slice(0, 10)
                        : ''
                    }
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* I. Datos generales */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">I</span> Datos Generales
            </legend>
            <div className="rejilla rejilla--3">
              <div className="campo">
                <label>
                  Apellido paterno <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.apellidoPaterno)}
                  {...register('apellidoPaterno', {
                    required: 'Ingresa el apellido paterno',
                  })}
                />
                {mensajeError('apellidoPaterno')}
              </div>
              <div className="campo">
                <label>
                  Apellido materno <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.apellidoMaterno)}
                  {...register('apellidoMaterno', {
                    required: 'Ingresa el apellido materno',
                  })}
                />
                {mensajeError('apellidoMaterno')}
              </div>
              <div className="campo">
                <label>
                  Nombres <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.nombres)}
                  {...register('nombres', { required: 'Ingresa los nombres' })}
                />
                {mensajeError('nombres')}
              </div>
              <div className="campo">
                <label>
                  Lugar de nacimiento <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.lugarNacimiento)}
                  {...register('lugarNacimiento', {
                    required: 'Ingresa el lugar de nacimiento',
                  })}
                />
                {mensajeError('lugarNacimiento')}
              </div>
              <div className="campo">
                <label>
                  Fecha de nacimiento <span className="req">*</span>
                </label>
                <input
                  type="date"
                  aria-invalid={Boolean(errors.fechaNacimiento)}
                  {...register('fechaNacimiento', {
                    required: 'Ingresa la fecha de nacimiento',
                  })}
                />
                {mensajeError('fechaNacimiento')}
              </div>
              <div className="campo">
                <label>Edad</label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  placeholder="Se calcula sola"
                  {...register('edad')}
                />
                <span className="ayuda">
                  Se calcula con la fecha de nacimiento; puedes editarla.
                </span>
              </div>
              <div className="campo">
                <label>
                  Procedencia <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.procedencia)}
                  {...register('procedencia', {
                    required: 'Ingresa la procedencia',
                  })}
                />
                {mensajeError('procedencia')}
              </div>
              <div className="campo">
                <label>Ocupación</label>
                <input {...register('ocupacion')} />
              </div>
              <div className="campo">
                <label>Dirección</label>
                <input {...register('direccion')} />
              </div>
              <div className="campo">
                <label>Teléfono</label>
                <input {...register('telefono')} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Grado de instrucción <span className="req">*</span>
              </label>
              <div className="chips">
                {GRADOS_INSTRUCCION.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('gradoInstruccion', {
                        required: 'Selecciona el grado de instrucción',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('gradoInstruccion')}
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Estado civil <span className="req">*</span>
              </label>
              <div className="chips">
                {ESTADOS_CIVILES.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('estadoCivil', {
                        required: 'Selecciona el estado civil',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('estadoCivil')}
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Aseguramiento <span className="req">*</span>
              </label>
              <div className="chips">
                {ASEGURAMIENTOS.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('aseguramiento', {
                        required: 'Selecciona el aseguramiento',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('aseguramiento')}
              {aseguramiento === 'Otro' && (
                <div className="campo" style={{ marginTop: 10, maxWidth: 320 }}>
                  <label>Especifica el aseguramiento</label>
                  <input {...register('aseguramientoOtro')} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Condición ocupacional <span className="req">*</span>
              </label>
              <div className="chips">
                {CONDICIONES_OCUPACIONALES.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('condicionOcupacional', {
                        required: 'Selecciona la condición ocupacional',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('condicionOcupacional')}
            </div>

            <div className="rejilla rejilla--3" style={{ marginTop: 16 }}>
              <div className="campo">
                <label>Acompañante: nombre</label>
                <input {...register('acompananteNombre')} />
              </div>
              <div className="campo">
                <label>Acompañante: dirección</label>
                <input {...register('acompananteDireccion')} />
              </div>
              <div className="campo">
                <label>Acompañante: teléfono</label>
                <input {...register('acompananteTelefono')} />
              </div>
            </div>
          </fieldset>

          {/* II. Composición familiar */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">II</span> Composición Familiar
            </legend>
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nombres y apellidos</th>
                    <th>Parentesco</th>
                    <th>Edad</th>
                    <th>Grado instrucción</th>
                    <th>Asegurado</th>
                    <th>Ocupación</th>
                    <th>Ingreso</th>
                    <th>Observaciones</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td>
                        <input
                          {...register(
                            `composicionFamiliar.${index}.nombresApellidos`,
                          )}
                        />
                      </td>
                      <td>
                        <input
                          {...register(
                            `composicionFamiliar.${index}.parentesco`,
                          )}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={130}
                          style={{ width: 70 }}
                          {...register(`composicionFamiliar.${index}.edad`)}
                        />
                      </td>
                      <td>
                        <input
                          {...register(
                            `composicionFamiliar.${index}.gradoInstruccion`,
                          )}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          {...register(
                            `composicionFamiliar.${index}.esAsegurado`,
                          )}
                        />
                      </td>
                      <td>
                        <input
                          {...register(
                            `composicionFamiliar.${index}.ocupacion`,
                          )}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          style={{ width: 90 }}
                          {...register(`composicionFamiliar.${index}.ingreso`)}
                        />
                      </td>
                      <td>
                        <input
                          {...register(
                            `composicionFamiliar.${index}.observaciones`,
                          )}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--fantasma btn--chico"
                          onClick={() => remove(index)}
                          aria-label="Quitar miembro"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn--secundario btn--chico"
                onClick={() => append({ ...MIEMBRO_VACIO })}
              >
                <Icono nombre="mas" />
                Agregar miembro
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Grado de dependencia económica <span className="req">*</span>
              </label>
              <div className="chips">
                {GRADOS_DEPENDENCIA.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('gradoDependenciaEconomica', {
                        required: 'Selecciona el grado de dependencia',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('gradoDependenciaEconomica')}
            </div>
          </fieldset>

          {/* III. Ingreso y gastos */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">III</span> Ingreso y Gastos
            </legend>
            <div className="rejilla rejilla--4">
              <div className="campo">
                <label>Ingreso familiar (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('ingresoFamiliar')}
                />
              </div>
              <div className="campo">
                <label>Ayudas/apoyos (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('ayudasApoyos')}
                />
              </div>
              <div className="campo">
                <label>Rentas (S/)</label>
                <input type="number" min={0} step="0.01" {...register('rentas')} />
              </div>
              <div className="campo">
                <label>Otros ingresos (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('otrosIngresos')}
                />
              </div>
              <div className="campo">
                <label>Gasto alimentación (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('gastoAlimentacion')}
                />
              </div>
              <div className="campo">
                <label>Gasto vivienda (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('gastoVivienda')}
                />
              </div>
              <div className="campo">
                <label>Gasto movilidad (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('gastoMovilidad')}
                />
              </div>
              <div className="campo">
                <label>Otros gastos (S/)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('otrosGastos')}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Tramo de ingreso <span className="req">*</span>
              </label>
              <div className="chips">
                {TRAMOS_INGRESO.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('tramoIngreso', {
                        required: 'Selecciona el tramo de ingreso',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('tramoIngreso')}
            </div>
          </fieldset>

          {/* IV. Vivienda */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">IV</span> Vivienda
            </legend>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Tenencia <span className="req">*</span>
              </label>
              <div className="chips">
                {TENENCIAS.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('tenencia', {
                        required: 'Selecciona la tenencia',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('tenencia')}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Material de construcción <span className="req">*</span>
              </label>
              <div className="chips">
                {MATERIALES.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('materialConstruccion', {
                        required: 'Selecciona el material de construcción',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('materialConstruccion')}
            </div>

            <div className="rejilla rejilla--3" style={{ marginBottom: 16 }}>
              <div className="campo">
                <label>
                  Nº miembros del hogar <span className="req">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  aria-invalid={Boolean(errors.nroMiembrosHogar)}
                  {...register('nroMiembrosHogar', {
                    required: 'Ingresa el número de miembros del hogar',
                  })}
                />
                {mensajeError('nroMiembrosHogar')}
              </div>
              <div className="campo">
                <label>
                  Nº ambientes para dormir <span className="req">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  aria-invalid={Boolean(errors.nroAmbientesDormir)}
                  {...register('nroAmbientesDormir', {
                    required: 'Ingresa el número de ambientes para dormir',
                    min: { value: 1, message: 'Debe ser al menos 1' },
                  })}
                />
                {mensajeError('nroAmbientesDormir')}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--tinta-media)',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Servicios básicos <span className="req">*</span>
              </label>
              <div className="chips">
                {SERVICIOS_BASICOS.map((opcion) => (
                  <label key={opcion} className="chip-opcion">
                    <input
                      type="radio"
                      value={opcion}
                      {...register('serviciosBasicos', {
                        required: 'Selecciona los servicios básicos',
                      })}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
              {mensajeError('serviciosBasicos')}
            </div>
          </fieldset>

          {/* V. Equipamiento */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">V</span> Equipamiento del Hogar{' '}
              <span className="req">*</span>
            </legend>
            <div className="chips">
              {EQUIPAMIENTOS.map((opcion) => (
                <label key={opcion} className="chip-opcion">
                  <input
                    type="radio"
                    value={opcion}
                    {...register('equipamientoHogar', {
                      required: 'Selecciona el equipamiento del hogar',
                    })}
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
            {mensajeError('equipamientoHogar')}
          </fieldset>

          {/* VI. Factores de riesgo */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">VI</span> Factores de Riesgo
            </legend>
            <div className="campo" style={{ marginBottom: 14 }}>
              <label>Descripción de factores de riesgo</label>
              <textarea
                rows={3}
                placeholder="Detalle de la situación de riesgo…"
                {...register('factoresRiesgoTexto')}
              />
            </div>
            <div className="chips">
              {FACTORES_RIESGO.map((opcion) => (
                <label key={opcion} className="chip-opcion">
                  <input
                    type="checkbox"
                    value={opcion}
                    {...register('factoresRiesgo')}
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
            <div className="campo" style={{ marginTop: 16, maxWidth: 280 }}>
              <label>Puntaje de estudio social (opcional)</label>
              <input
                type="number"
                min={0}
                {...register('puntajeEstudioSocial')}
              />
            </div>
          </fieldset>

          <fieldset className="seccion">
            <legend>Firma</legend>
            <p className="texto-suave" style={{ margin: 0 }}>
              La ficha quedará firmada por{' '}
              <strong>
                {editando ? existente?.trabajadoraSocial : usuario?.nombre}
              </strong>
              {editando
                ? ' (trabajadora social que la registró).'
                : ' (usuario con la sesión activa).'}
            </p>
          </fieldset>
        </div>

        <div className="pie-formulario">
          <Link
            to={editando ? `/fichas/${id}` : '/fichas'}
            className="btn btn--secundario"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn--primario"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Guardando…'
              : editando
                ? 'Guardar cambios'
                : 'Registrar ficha'}
          </button>
        </div>
      </form>
    </>
  );
}
