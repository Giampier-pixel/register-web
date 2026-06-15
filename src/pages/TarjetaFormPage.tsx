import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { tarjetasApi } from '../api';
import { ApiError } from '../api/client';
import {
  ESTADOS_CIVILES,
  GRADOS_INSTRUCCION,
  OCUPACIONES,
  SALUD_FAMILIAR,
  SERVICIOS_BASICOS,
  VIVIENDAS,
  type FamiliarConyuge,
  type SaludFamiliar,
  type Tarjeta,
  type TarjetaInput,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Cargando } from '../components/Cargando';
import { Icono } from '../components/Icono';

interface ValoresFamiliar {
  nombre: string;
  edad: string;
  gradoInstruccion: string;
  telefono: string;
  ocupacion: string;
  centroTrabajo: string;
}

interface ValoresFicha {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  nroHistoriaClinica: string;
  procedencia: string;
  transferido: string;
  lugarNacimiento: string;
  fechaNacimiento: string;
  edad: string;
  gradoInstruccion: string;
  estadoCivil: string;
  ocupacion: string;
  ingresoEconomico: string;
  gradoDependencia: string;
  direccion: string;
  distrito: string;
  vivienda: string;
  serviciosBasicos: string;
  padreConyuge: ValoresFamiliar;
  madreConyuge: ValoresFamiliar;
  numeroHermanosHijos: string;
  observaciones: string;
  saludFamiliar: SaludFamiliar[];
  dx: string;
  preDiagnosticoSocial: string;
}

const FAMILIAR_VACIO: ValoresFamiliar = {
  nombre: '',
  edad: '',
  gradoInstruccion: '',
  telefono: '',
  ocupacion: '',
  centroTrabajo: '',
};

const VALORES_INICIALES: ValoresFicha = {
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombres: '',
  nroHistoriaClinica: '',
  procedencia: '',
  transferido: '',
  lugarNacimiento: '',
  fechaNacimiento: '',
  edad: '',
  gradoInstruccion: '',
  estadoCivil: '',
  ocupacion: '',
  ingresoEconomico: '',
  gradoDependencia: '0',
  direccion: '',
  distrito: '',
  vivienda: '',
  serviciosBasicos: '',
  padreConyuge: { ...FAMILIAR_VACIO },
  madreConyuge: { ...FAMILIAR_VACIO },
  numeroHermanosHijos: '',
  observaciones: '',
  saludFamiliar: [],
  dx: '',
  preDiagnosticoSocial: '',
};

const limpiar = (valor: string): string | undefined => {
  const texto = valor.trim();
  return texto === '' ? undefined : texto;
};

function aFamiliar(valores: ValoresFamiliar): FamiliarConyuge | undefined {
  const familiar: FamiliarConyuge = {
    nombre: limpiar(valores.nombre),
    edad: valores.edad.trim() === '' ? undefined : Number(valores.edad),
    gradoInstruccion: limpiar(valores.gradoInstruccion),
    telefono: limpiar(valores.telefono),
    ocupacion: limpiar(valores.ocupacion),
    centroTrabajo: limpiar(valores.centroTrabajo),
  };
  const tieneAlgo = Object.values(familiar).some((v) => v !== undefined);
  return tieneAlgo ? familiar : undefined;
}

function aPayload(v: ValoresFicha): TarjetaInput {
  const datosFamiliares = {
    numeroHermanosHijos: limpiar(v.numeroHermanosHijos),
    observaciones: limpiar(v.observaciones),
  };
  return {
    paciente: {
      apellidoPaterno: v.apellidoPaterno.trim(),
      apellidoMaterno: v.apellidoMaterno.trim(),
      nombres: v.nombres.trim(),
      nroHistoriaClinica: limpiar(v.nroHistoriaClinica),
      procedencia: v.procedencia.trim(),
      transferido: limpiar(v.transferido),
      lugarNacimiento: v.lugarNacimiento.trim(),
      fechaNacimiento: v.fechaNacimiento,
      edad: v.edad.trim() === '' ? undefined : Number(v.edad),
    },
    gradoInstruccion: v.gradoInstruccion as TarjetaInput['gradoInstruccion'],
    estadoCivil: v.estadoCivil as TarjetaInput['estadoCivil'],
    ocupacion: v.ocupacion as TarjetaInput['ocupacion'],
    socioeconomico: {
      ingresoEconomico: Number(v.ingresoEconomico),
      gradoDependencia: Number(v.gradoDependencia),
      direccion: v.direccion.trim(),
      distrito: v.distrito.trim(),
    },
    vivienda: v.vivienda as TarjetaInput['vivienda'],
    serviciosBasicos: v.serviciosBasicos as TarjetaInput['serviciosBasicos'],
    padreConyuge: aFamiliar(v.padreConyuge),
    madreConyuge: aFamiliar(v.madreConyuge),
    datosFamiliares: Object.values(datosFamiliares).some(
      (x) => x !== undefined,
    )
      ? datosFamiliares
      : undefined,
    saludFamiliar: v.saludFamiliar,
    dx: limpiar(v.dx),
    preDiagnosticoSocial: v.preDiagnosticoSocial.trim(),
  };
}

function aValores(t: Tarjeta): ValoresFicha {
  return {
    apellidoPaterno: t.paciente.apellidoPaterno,
    apellidoMaterno: t.paciente.apellidoMaterno,
    nombres: t.paciente.nombres,
    nroHistoriaClinica: t.paciente.nroHistoriaClinica ?? '',
    procedencia: t.paciente.procedencia,
    transferido: t.paciente.transferido ?? '',
    lugarNacimiento: t.paciente.lugarNacimiento,
    fechaNacimiento: t.paciente.fechaNacimiento.slice(0, 10),
    edad: String(t.paciente.edad),
    gradoInstruccion: t.gradoInstruccion,
    estadoCivil: t.estadoCivil,
    ocupacion: t.ocupacion,
    ingresoEconomico: String(t.socioeconomico.ingresoEconomico),
    gradoDependencia: String(t.socioeconomico.gradoDependencia),
    direccion: t.socioeconomico.direccion,
    distrito: t.socioeconomico.distrito,
    vivienda: t.vivienda,
    serviciosBasicos: t.serviciosBasicos,
    padreConyuge: {
      ...FAMILIAR_VACIO,
      ...Object.fromEntries(
        Object.entries(t.padreConyuge ?? {}).map(([k, val]) => [
          k,
          String(val ?? ''),
        ]),
      ),
    },
    madreConyuge: {
      ...FAMILIAR_VACIO,
      ...Object.fromEntries(
        Object.entries(t.madreConyuge ?? {}).map(([k, val]) => [
          k,
          String(val ?? ''),
        ]),
      ),
    },
    numeroHermanosHijos: t.datosFamiliares?.numeroHermanosHijos ?? '',
    observaciones: t.datosFamiliares?.observaciones ?? '',
    saludFamiliar: t.saludFamiliar,
    dx: t.dx ?? '',
    preDiagnosticoSocial: t.preDiagnosticoSocial,
  };
}

export function TarjetaFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const [errorApi, setErrorApi] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFicha>({ defaultValues: VALORES_INICIALES });

  const { data: existente, isPending: cargandoExistente } = useQuery({
    queryKey: ['tarjeta', id],
    queryFn: () => tarjetasApi.detalle(id!),
    enabled: editando,
  });

  useEffect(() => {
    if (existente) {
      reset(aValores(existente));
    }
  }, [existente, reset]);

  const guardar = useMutation({
    mutationFn: (valores: ValoresFicha) =>
      editando
        ? tarjetasApi.editar(id!, aPayload(valores))
        : tarjetasApi.crear(aPayload(valores)),
    onSuccess: async (tarjeta) => {
      await queryClient.invalidateQueries({ queryKey: ['tarjetas'] });
      await queryClient.invalidateQueries({ queryKey: ['tarjeta', tarjeta.id] });
      navigate(`/tarjetas/${tarjeta.id}`, {
        state: editando
          ? { mensaje: 'Cambios guardados correctamente.' }
          : {
              mensaje: `Tarjeta registrada con el folio Nº ${tarjeta.nroTarjetaSocial}.`,
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
    return <Cargando texto="Cargando tarjeta…" />;
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
          <h1>{editando ? 'Editar tarjeta' : 'Nueva tarjeta'}</h1>
          <p className="subtitulo mt-0">
            {editando
              ? `Folio Nº ${existente?.nroTarjetaSocial ?? ''}`
              : 'Los campos marcados con * son obligatorios'}
          </p>
        </div>
        <Link
          to={editando ? `/tarjetas/${id}` : '/tarjetas'}
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
            <h2>Tarjeta de Trabajo Social</h2>
          </div>
          <div className="folio-caja">
            <div className="rotulo">Nº Tarjeta Social</div>
            <div className="numero">
              {editando ? existente?.nroTarjetaSocial : 'auto'}
            </div>
          </div>
        </div>

        <div className="ficha__cuerpo">
          {/* 1 — Datos del paciente */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">1</span> Datos del Paciente
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
                <label>Nº Historia clínica</label>
                <input {...register('nroHistoriaClinica')} />
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
                <label>Transferido (derivado de)</label>
                <input {...register('transferido')} />
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
                  Si la dejas vacía se calcula con la fecha de nacimiento.
                </span>
              </div>
            </div>
          </fieldset>

          {/* 2-4 — selecciones únicas */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">2</span> Grado de Instrucción{' '}
              <span className="req">*</span>
            </legend>
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
          </fieldset>

          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">3</span> Estado Civil{' '}
              <span className="req">*</span>
            </legend>
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
          </fieldset>

          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">4</span> Ocupación{' '}
              <span className="req">*</span>
            </legend>
            <div className="chips">
              {OCUPACIONES.map((opcion) => (
                <label key={opcion} className="chip-opcion">
                  <input
                    type="radio"
                    value={opcion}
                    {...register('ocupacion', {
                      required: 'Selecciona la ocupación',
                    })}
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
            {mensajeError('ocupacion')}
          </fieldset>

          {/* 5 — Socioeconómico */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">5</span> Datos Socioeconómicos
            </legend>
            <div className="rejilla rejilla--4">
              <div className="campo">
                <label>
                  Ingreso económico (S/) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  aria-invalid={Boolean(errors.ingresoEconomico)}
                  {...register('ingresoEconomico', {
                    required: 'Ingresa el ingreso económico',
                    min: { value: 0, message: 'No puede ser negativo' },
                  })}
                />
                {mensajeError('ingresoEconomico')}
              </div>
              <div className="campo">
                <label>
                  Grado de dependencia <span className="req">*</span>
                </label>
                <select {...register('gradoDependencia')}>
                  {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n > 0 ? `+${n}` : n}
                    </option>
                  ))}
                </select>
                <span className="ayuda">Escala de −3 a +3</span>
              </div>
              <div className="campo">
                <label>
                  Dirección <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.direccion)}
                  {...register('direccion', {
                    required: 'Ingresa la dirección',
                  })}
                />
                {mensajeError('direccion')}
              </div>
              <div className="campo">
                <label>
                  Distrito <span className="req">*</span>
                </label>
                <input
                  aria-invalid={Boolean(errors.distrito)}
                  {...register('distrito', { required: 'Ingresa el distrito' })}
                />
                {mensajeError('distrito')}
              </div>
            </div>
          </fieldset>

          {/* 6-7 */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">6</span> Vivienda{' '}
              <span className="req">*</span>
            </legend>
            <div className="chips">
              {VIVIENDAS.map((opcion) => (
                <label key={opcion} className="chip-opcion">
                  <input
                    type="radio"
                    value={opcion}
                    {...register('vivienda', {
                      required: 'Selecciona el tipo de vivienda',
                    })}
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
            {mensajeError('vivienda')}
          </fieldset>

          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">7</span> Servicios Básicos{' '}
              <span className="req">*</span>
            </legend>
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
          </fieldset>

          {/* 8-9 — Familiares */}
          {(
            [
              ['padreConyuge', '8', 'Padre o Cónyuge'],
              ['madreConyuge', '9', 'Madre o Cónyuge'],
            ] as const
          ).map(([clave, numero, titulo]) => (
            <fieldset className="seccion" key={clave}>
              <legend>
                <span className="seccion__numero">{numero}</span> {titulo}{' '}
                <span className="texto-suave" style={{ fontSize: 13 }}>
                  (opcional)
                </span>
              </legend>
              <div className="rejilla rejilla--3">
                <div className="campo col-2">
                  <label>Nombre completo</label>
                  <input {...register(`${clave}.nombre`)} />
                </div>
                <div className="campo">
                  <label>Edad</label>
                  <input
                    type="number"
                    min={0}
                    max={130}
                    {...register(`${clave}.edad`)}
                  />
                </div>
                <div className="campo">
                  <label>Grado de instrucción</label>
                  <input {...register(`${clave}.gradoInstruccion`)} />
                </div>
                <div className="campo">
                  <label>Teléfono</label>
                  <input {...register(`${clave}.telefono`)} />
                </div>
                <div className="campo">
                  <label>Ocupación</label>
                  <input {...register(`${clave}.ocupacion`)} />
                </div>
                <div className="campo col-2">
                  <label>Centro de trabajo</label>
                  <input {...register(`${clave}.centroTrabajo`)} />
                </div>
              </div>
            </fieldset>
          ))}

          {/* 10 — Datos familiares */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">10</span> Datos Familiares
            </legend>
            <div className="rejilla rejilla--3">
              <div className="campo">
                <label>Número de hermanos o hijos</label>
                <input
                  placeholder="Ej.: 3 hijos"
                  {...register('numeroHermanosHijos')}
                />
              </div>
              <div className="campo col-2">
                <label>Observaciones familiares</label>
                <input {...register('observaciones')} />
              </div>
            </div>
          </fieldset>

          {/* 11 — Salud familiar */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">11</span> Salud Familiar y
              Problemas Sociales
            </legend>
            <div className="chips">
              {SALUD_FAMILIAR.map((opcion) => (
                <label key={opcion} className="chip-opcion">
                  <input
                    type="checkbox"
                    value={opcion}
                    {...register('saludFamiliar')}
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 12-13 — Diagnósticos */}
          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">12</span> Diagnóstico (Dx)
            </legend>
            <div className="campo">
              <input
                placeholder="Diagnóstico médico"
                {...register('dx')}
              />
            </div>
          </fieldset>

          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">13</span> Pre-Diagnóstico
              Social <span className="req">*</span>
            </legend>
            <div className="campo">
              <textarea
                rows={5}
                aria-invalid={Boolean(errors.preDiagnosticoSocial)}
                placeholder="Apreciación profesional del caso…"
                {...register('preDiagnosticoSocial', {
                  required: 'El pre-diagnóstico social es obligatorio',
                })}
              />
              {mensajeError('preDiagnosticoSocial')}
            </div>
          </fieldset>

          <fieldset className="seccion">
            <legend>
              <span className="seccion__numero">14</span> Firma
            </legend>
            <p className="texto-suave" style={{ margin: 0 }}>
              La tarjeta quedará firmada por{' '}
              <strong>
                {editando ? existente?.asistenteSocial : usuario?.nombre}
              </strong>
              {editando
                ? ' (asistente social que la registró).'
                : ' (usuario con la sesión activa).'}
            </p>
          </fieldset>
        </div>

        <div className="pie-formulario">
          <Link
            to={editando ? `/tarjetas/${id}` : '/tarjetas'}
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
                : 'Registrar tarjeta'}
          </button>
        </div>
      </form>
    </>
  );
}
