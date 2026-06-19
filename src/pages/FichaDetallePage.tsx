import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fichasApi } from '../api';
import { ApiError } from '../api/client';
import type { MiembroFamiliar } from '../api/types';
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

function formatearMoneda(valor?: number): string {
  return valor === undefined || valor === null
    ? ''
    : `S/ ${valor.toFixed(2)}`;
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

function TablaFamiliar({ miembros }: { miembros: MiembroFamiliar[] }) {
  if (miembros.length === 0) {
    return (
      <p className="texto-suave" style={{ margin: 0 }}>
        Sin miembros registrados.
      </p>
    );
  }
  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Nombres y apellidos</th>
            <th>Parentesco</th>
            <th>Edad</th>
            <th>Grado de instrucción</th>
            <th>Asegurado</th>
            <th>Ocupación</th>
            <th>Ingreso</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {miembros.map((m, i) => (
            <tr key={i}>
              <td>{m.nombresApellidos}</td>
              <td>{m.parentesco ?? ''}</td>
              <td>{m.edad ?? ''}</td>
              <td>{m.gradoInstruccion ?? ''}</td>
              <td>{m.esAsegurado ? 'Sí' : 'No'}</td>
              <td>{m.ocupacion ?? ''}</td>
              <td>{m.ingreso !== undefined ? formatearMoneda(m.ingreso) : ''}</td>
              <td>{m.observaciones ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FichaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state } = useLocation() as { state?: { mensaje?: string } };
  const [confirmando, setConfirmando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const { data: ficha, isPending, isError } = useQuery({
    queryKey: ['ficha', id],
    queryFn: () => fichasApi.detalle(id!),
  });

  const cambiarEstado = useMutation({
    mutationFn: () =>
      ficha!.activa
        ? fichasApi.desactivar(ficha!.id)
        : fichasApi.activar(ficha!.id),
    onSuccess: async () => {
      setConfirmando(false);
      await queryClient.invalidateQueries({ queryKey: ['ficha', id] });
      await queryClient.invalidateQueries({ queryKey: ['fichas'] });
    },
    onError: (err) => {
      setConfirmando(false);
      setErrorAccion(
        err instanceof ApiError ? err.message : 'No se pudo completar la acción',
      );
    },
  });

  if (isPending) {
    return <Cargando texto="Cargando ficha…" />;
  }
  if (isError || !ficha) {
    return (
      <div className="tabla-vacia" role="alert">
        <span className="glifo">!</span>
        No se encontró la ficha.{' '}
        <Link to="/fichas">Volver al listado</Link>
      </div>
    );
  }

  const p = ficha.paciente;
  const ig = ficha.ingresosGastos;
  const acompanante = ficha.personaAcompana;

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>
            {p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}
          </h1>
          <p className="subtitulo mt-0">
            Inscrita el {formatearFecha(ficha.fechaInscripcion)} ·{' '}
            <span
              className={`insignia ${
                ficha.activa ? 'insignia--activa' : 'insignia--inactiva'
              }`}
            >
              {ficha.activa ? 'Activa' : 'Desactivada'}
            </span>
          </p>
        </div>
        <div className="barra-acciones">
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => navigate('/fichas')}
          >
            <Icono nombre="volver" />
            Listado
          </button>
          <Link to={`/fichas/${ficha.id}/editar`} className="btn btn--primario">
            <Icono nombre="editar" />
            Editar
          </Link>
          <button
            type="button"
            className={`btn ${ficha.activa ? 'btn--peligro' : 'btn--secundario'}`}
            onClick={() => setConfirmando(true)}
          >
            <Icono nombre="apagar" />
            {ficha.activa ? 'Desactivar' : 'Reactivar'}
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
            <h2>Ficha Social</h2>
          </div>
          <div className="folio-caja">
            <div className="rotulo">Nº Ficha Social</div>
            <div className="numero">{ficha.nroFichaSocial}</div>
          </div>
        </div>

        <div className="ficha__cuerpo">
          <section className="seccion seccion--puntaje">
            <div className="seccion__titulo">Puntaje y Categoría</div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Puntaje básico" valor={ficha.puntajes.puntajeBasico} />
              <div className="dato">
                <dt>Categoría</dt>
                <dd>
                  <span
                    className={`insignia insignia--categoria-${ficha.puntajes.categoria.toLowerCase()}`}
                  >
                    {ficha.puntajes.categoria}
                  </span>
                </dd>
              </div>
              <Dato
                etiqueta="Puntaje estudio social"
                valor={ficha.puntajes.puntajeEstudioSocial}
              />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">I</span> Datos Generales
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Apellido paterno" valor={p.apellidoPaterno} />
              <Dato etiqueta="Apellido materno" valor={p.apellidoMaterno} />
              <Dato etiqueta="Nombres" valor={p.nombres} />
              <Dato etiqueta="Nº Historia clínica" valor={p.nroHistoriaClinica} />
              <Dato etiqueta="Procedencia" valor={p.procedencia} />
              <Dato etiqueta="Lugar de nacimiento" valor={p.lugarNacimiento} />
              <Dato
                etiqueta="Fecha de nacimiento"
                valor={formatearFecha(p.fechaNacimiento)}
              />
              <Dato etiqueta="Edad" valor={`${p.edad} años`} />
              <Dato etiqueta="Servicio" valor={ficha.servicio} />
              <Dato etiqueta="Grado de instrucción" valor={ficha.gradoInstruccion} />
              <Dato etiqueta="Estado civil" valor={ficha.estadoCivil} />
              <Dato
                etiqueta="Aseguramiento"
                valor={
                  ficha.aseguramiento === 'Otro' && ficha.aseguramientoOtro
                    ? `Otro: ${ficha.aseguramientoOtro}`
                    : ficha.aseguramiento
                }
              />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">Ocupación y contacto</div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Ocupación" valor={ficha.ocupacion} />
              <Dato
                etiqueta="Condición ocupacional"
                valor={ficha.condicionOcupacional}
              />
              <Dato etiqueta="Dirección" valor={ficha.direccion} />
              <Dato etiqueta="Teléfono" valor={ficha.telefono} />
              <Dato etiqueta="Acompañante" valor={acompanante?.nombre} />
              <Dato
                etiqueta="Dirección del acompañante"
                valor={acompanante?.direccion}
              />
              <Dato
                etiqueta="Teléfono del acompañante"
                valor={acompanante?.telefono}
              />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">II</span> Composición Familiar
            </div>
            <TablaFamiliar miembros={ficha.composicionFamiliar} />
            <dl className="rejilla rejilla--3" style={{ margin: '16px 0 0' }}>
              <Dato
                etiqueta="Grado de dependencia económica"
                valor={ficha.gradoDependenciaEconomica}
              />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">III</span> Ingreso y Gastos
            </div>
            <dl className="rejilla rejilla--4" style={{ margin: 0 }}>
              <Dato
                etiqueta="Ingreso familiar"
                valor={formatearMoneda(ig?.ingresoFamiliar)}
              />
              <Dato
                etiqueta="Ayudas/apoyos"
                valor={formatearMoneda(ig?.ayudasApoyos)}
              />
              <Dato etiqueta="Rentas" valor={formatearMoneda(ig?.rentas)} />
              <Dato
                etiqueta="Otros ingresos"
                valor={formatearMoneda(ig?.otrosIngresos)}
              />
              <Dato
                etiqueta="Gasto alimentación"
                valor={formatearMoneda(ig?.gastoAlimentacion)}
              />
              <Dato
                etiqueta="Gasto vivienda"
                valor={formatearMoneda(ig?.gastoVivienda)}
              />
              <Dato
                etiqueta="Gasto movilidad"
                valor={formatearMoneda(ig?.gastoMovilidad)}
              />
              <Dato
                etiqueta="Otros gastos"
                valor={formatearMoneda(ig?.otrosGastos)}
              />
              <Dato etiqueta="Tramo de ingreso" valor={ficha.tramoIngreso} />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">IV</span> Vivienda
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Tenencia" valor={ficha.vivienda.tenencia} />
              <Dato
                etiqueta="Material de construcción"
                valor={ficha.vivienda.materialConstruccion}
              />
              <Dato
                etiqueta="Nº miembros del hogar"
                valor={ficha.vivienda.nroMiembrosHogar}
              />
              <Dato
                etiqueta="Nº ambientes para dormir"
                valor={ficha.vivienda.nroAmbientesDormir}
              />
              <Dato
                etiqueta="Servicios básicos"
                valor={ficha.vivienda.serviciosBasicos}
              />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">V</span> Equipamiento
            </div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Equipamiento del hogar" valor={ficha.equipamientoHogar} />
            </dl>
          </section>

          <section className="seccion">
            <div className="seccion__titulo">
              <span className="seccion__numero">VI</span> Factores de Riesgo
            </div>
            {ficha.factoresRiesgo.length === 0 ? (
              <p className="texto-suave" style={{ margin: 0 }}>
                Sin factores de riesgo registrados.
              </p>
            ) : (
              <div className="chips solo-lectura">
                {ficha.factoresRiesgo.map((f) => (
                  <label key={f} className="chip-opcion">
                    <input type="checkbox" checked readOnly disabled />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            )}
            {ficha.factoresRiesgoTexto && (
              <p className="texto-largo-detalle" style={{ marginTop: 16 }}>
                {ficha.factoresRiesgoTexto}
              </p>
            )}
          </section>

          <section className="seccion">
            <div className="seccion__titulo">Firma</div>
            <dl className="rejilla rejilla--3" style={{ margin: 0 }}>
              <Dato etiqueta="Trabajadora social" valor={ficha.trabajadoraSocial} />
              <Dato
                etiqueta="Última modificación"
                valor={formatearFecha(ficha.updatedAt)}
              />
            </dl>
          </section>
        </div>
      </article>

      <Modal
        titulo={ficha.activa ? 'Desactivar ficha' : 'Reactivar ficha'}
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
              className={`btn ${ficha.activa ? 'btn--peligro' : 'btn--primario'}`}
              onClick={() => cambiarEstado.mutate()}
              disabled={cambiarEstado.isPending}
            >
              {cambiarEstado.isPending
                ? 'Aplicando…'
                : ficha.activa
                  ? 'Sí, desactivar'
                  : 'Sí, reactivar'}
            </button>
          </>
        }
      >
        {ficha.activa ? (
          <p style={{ margin: 0 }}>
            La ficha <strong>Nº {ficha.nroFichaSocial}</strong> dejará de
            aparecer entre las activas, pero <strong>no se elimina</strong>:
            podrás reactivarla cuando quieras.
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            La ficha <strong>Nº {ficha.nroFichaSocial}</strong> volverá a
            aparecer entre las activas.
          </p>
        )}
      </Modal>
    </>
  );
}
