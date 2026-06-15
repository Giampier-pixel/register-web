import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
} from '../api/types';
import { Cargando } from '../components/Cargando';
import { Icono } from '../components/Icono';
import { Modal } from '../components/Modal';

function formatearFecha(iso?: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(iso));
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | number }) {
  const vacio = valor === undefined || valor === null || valor === '';
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd className={vacio ? 'vacio' : ''}>{vacio ? '' : valor}</dd>
    </div>
  );
}

function Opciones({
  opciones,
  seleccion,
}: {
  opciones: readonly string[];
  seleccion: string[];
}) {
  return (
    <div className="chips solo-lectura">
      {opciones.map((opcion) => {
        const marcada = seleccion.includes(opcion);
        return (
          <label key={opcion} className="chip-opcion">
            <input type="checkbox" checked={marcada} readOnly disabled />
            <span>{opcion}</span>
          </label>
        );
      })}
    </div>
  );
}

function SeccionFamiliar({
  numero,
  titulo,
  familiar,
}: {
  numero: string;
  titulo: string;
  familiar?: FamiliarConyuge;
}) {
  return (
    <section className="seccion">
      <div className="seccion__titulo">
        <span className="seccion__numero">{numero}</span> {titulo}
      </div>
      <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
        <Dato etiqueta="Nombre" valor={familiar?.nombre} />
        <Dato etiqueta="Edad" valor={familiar?.edad} />
        <Dato etiqueta="Grado de instrucción" valor={familiar?.gradoInstruccion} />
        <Dato etiqueta="Teléfono" valor={familiar?.telefono} />
        <Dato etiqueta="Ocupación" valor={familiar?.ocupacion} />
        <Dato etiqueta="Centro de trabajo" valor={familiar?.centroTrabajo} />
      </dl>
    </section>
  );
}

export function TarjetaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state } = useLocation() as { state?: { mensaje?: string } };
  const [confirmando, setConfirmando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const { data: tarjeta, isPending, isError } = useQuery({
    queryKey: ['tarjeta', id],
    queryFn: () => tarjetasApi.detalle(id!),
  });

  const cambiarEstado = useMutation({
    mutationFn: () =>
      tarjeta!.activa
        ? tarjetasApi.desactivar(tarjeta!.id)
        : tarjetasApi.activar(tarjeta!.id),
    onSuccess: async () => {
      setConfirmando(false);
      await queryClient.invalidateQueries({ queryKey: ['tarjeta', id] });
      await queryClient.invalidateQueries({ queryKey: ['tarjetas'] });
    },
    onError: (err) => {
      setConfirmando(false);
      setErrorAccion(
        err instanceof ApiError ? err.message : 'No se pudo completar la acción',
      );
    },
  });

  if (isPending) {
    return <Cargando texto="Cargando tarjeta…" />;
  }
  if (isError || !tarjeta) {
    return (
      <div className="tabla-vacia" role="alert">
        <span className="glifo">!</span>
        No se encontró la tarjeta.{' '}
        <Link to="/tarjetas">Volver al listado</Link>
      </div>
    );
  }

  const p = tarjeta.paciente;

  const alDescargar = async () => {
    setDescargando(true);
    try {
      await tarjetasApi.descargarPdf(tarjeta.id, tarjeta.nroTarjetaSocial);
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : 'No se pudo generar el PDF',
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>
            {p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}
          </h1>
          <p className="subtitulo mt-0">
            Inscrita el {formatearFecha(tarjeta.fechaInscripcion)} ·{' '}
            <span
              className={`insignia ${
                tarjeta.activa ? 'insignia--activa' : 'insignia--inactiva'
              }`}
            >
              {tarjeta.activa ? 'Activa' : 'Desactivada'}
            </span>
          </p>
        </div>
        <div className="barra-acciones">
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => navigate('/tarjetas')}
          >
            <Icono nombre="volver" />
            Listado
          </button>
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => void alDescargar()}
            disabled={descargando}
          >
            <Icono nombre="pdf" />
            {descargando ? 'Generando…' : 'Descargar PDF'}
          </button>
          <Link to={`/tarjetas/${tarjeta.id}/editar`} className="btn btn--primario">
            <Icono nombre="editar" />
            Editar
          </Link>
          <button
            type="button"
            className={`btn ${tarjeta.activa ? 'btn--peligro' : 'btn--secundario'}`}
            onClick={() => setConfirmando(true)}
          >
            <Icono nombre="apagar" />
            {tarjeta.activa ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </div>

      {state?.mensaje && (
        <div className="alerta alerta--info" style={{ marginBottom: 16 }}>
          {state.mensaje}
        </div>
      )}
      {errorAccion && (
        <div className="alerta alerta--error" role="alert" style={{ marginBottom: 16 }}>
          <Icono nombre="alerta" />
          {errorAccion}
        </div>
      )}

      <article className="ficha">
        <div className="ficha__membrete">
          <div>
            <div className="linea-hospital">
              Hospital «Daniel A. Carrión» · Servicio de Trabajo Social
            </div>
            <h2>Tarjeta de Trabajo Social</h2>
          </div>
          <div className="folio-caja">
            <div className="rotulo">Nº Tarjeta Social</div>
            <div className="numero">{tarjeta.nroTarjetaSocial}</div>
          </div>
        </div>

        <div className="ficha__cuerpo">
          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">1</span> Datos del Paciente
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Apellido paterno" valor={p.apellidoPaterno} />
              <Dato etiqueta="Apellido materno" valor={p.apellidoMaterno} />
              <Dato etiqueta="Nombres" valor={p.nombres} />
              <Dato etiqueta="Nº Historia clínica" valor={p.nroHistoriaClinica} />
              <Dato etiqueta="Procedencia" valor={p.procedencia} />
              <Dato
                etiqueta="Fecha de inscripción"
                valor={formatearFecha(tarjeta.fechaInscripcion)}
              />
              <Dato etiqueta="Transferido (derivado de)" valor={p.transferido} />
              <Dato etiqueta="Lugar de nacimiento" valor={p.lugarNacimiento} />
              <Dato
                etiqueta="Fecha de nacimiento"
                valor={formatearFecha(p.fechaNacimiento)}
              />
              <Dato etiqueta="Edad" valor={`${p.edad} años`} />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">2</span> Grado de Instrucción
            </div>
            <Opciones
              opciones={GRADOS_INSTRUCCION}
              seleccion={[tarjeta.gradoInstruccion]}
            />
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">3</span> Estado Civil
            </div>
            <Opciones opciones={ESTADOS_CIVILES} seleccion={[tarjeta.estadoCivil]} />
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">4</span> Ocupación
            </div>
            <Opciones opciones={OCUPACIONES} seleccion={[tarjeta.ocupacion]} />
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">5</span> Datos Socioeconómicos
            </div>
            <dl className="rejilla rejilla--4" style={{ margin: 0 }}>
              <Dato
                etiqueta="Ingreso económico"
                valor={`S/ ${tarjeta.socioeconomico.ingresoEconomico.toFixed(2)}`}
              />
              <Dato
                etiqueta="Grado de dependencia"
                valor={
                  tarjeta.socioeconomico.gradoDependencia > 0
                    ? `+${tarjeta.socioeconomico.gradoDependencia}`
                    : tarjeta.socioeconomico.gradoDependencia
                }
              />
              <Dato etiqueta="Dirección" valor={tarjeta.socioeconomico.direccion} />
              <Dato etiqueta="Distrito" valor={tarjeta.socioeconomico.distrito} />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">6</span> Vivienda
            </div>
            <Opciones opciones={VIVIENDAS} seleccion={[tarjeta.vivienda]} />
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">7</span> Servicios Básicos
            </div>
            <Opciones
              opciones={SERVICIOS_BASICOS}
              seleccion={[tarjeta.serviciosBasicos]}
            />
          </section>

          <SeccionFamiliar
            numero="8"
            titulo="Padre o Cónyuge"
            familiar={tarjeta.padreConyuge}
          />
          <SeccionFamiliar
            numero="9"
            titulo="Madre o Cónyuge"
            familiar={tarjeta.madreConyuge}
          />

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">10</span> Datos Familiares
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato
                etiqueta="Número de hermanos o hijos"
                valor={tarjeta.datosFamiliares?.numeroHermanosHijos}
              />
              <div className="col-2">
                <Dato
                  etiqueta="Observaciones"
                  valor={tarjeta.datosFamiliares?.observaciones}
                />
              </div>
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">11</span> Salud Familiar y
              Problemas Sociales
            </div>
            {tarjeta.saludFamiliar.length === 0 ? (
              <p className="texto-suave" style={{ margin: 0 }}>
                Sin problemas registrados.
              </p>
            ) : (
              <Opciones
                opciones={SALUD_FAMILIAR}
                seleccion={tarjeta.saludFamiliar}
              />
            )}
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">12</span> Diagnóstico (Dx)
            </div>
            <p className="texto-largo-detalle">{tarjeta.dx || '—'}</p>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">13</span> Pre-Diagnóstico Social
            </div>
            <p className="texto-largo-detalle">{tarjeta.preDiagnosticoSocial}</p>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">14</span> Firma
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Asistente social" valor={tarjeta.asistenteSocial} />
              <Dato
                etiqueta="Última modificación"
                valor={formatearFecha(tarjeta.updatedAt)}
              />
            </dl>
          </section>
        </div>
      </article>

      <Modal
        titulo={tarjeta.activa ? 'Desactivar tarjeta' : 'Reactivar tarjeta'}
        abierto={confirmando}
        alCerrar={() => setConfirmando(false)}
        pie={
          <>
            <button
              type="button"
              className="btn btn--secundario"
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn ${tarjeta.activa ? 'btn--peligro' : 'btn--primario'}`}
              onClick={() => cambiarEstado.mutate()}
              disabled={cambiarEstado.isPending}
            >
              {cambiarEstado.isPending
                ? 'Aplicando…'
                : tarjeta.activa
                  ? 'Sí, desactivar'
                  : 'Sí, reactivar'}
            </button>
          </>
        }
      >
        {tarjeta.activa ? (
          <p style={{ margin: 0 }}>
            La tarjeta <strong>Nº {tarjeta.nroTarjetaSocial}</strong> dejará de
            aparecer entre las activas, pero <strong>no se elimina</strong>:
            podrás reactivarla cuando quieras.
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            La tarjeta <strong>Nº {tarjeta.nroTarjetaSocial}</strong> volverá a
            aparecer entre las activas.
          </p>
        )}
      </Modal>
    </>
  );
}
