import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tarjetasApi } from '../api';
import { ApiError } from '../api/client';
import type { Tarjeta } from '../api/types';
import { Cargando } from '../components/Cargando';
import { Icono } from '../components/Icono';

const LIMITE = 10;

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(iso));
}

export function TarjetasPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estado, setEstado] = useState<'' | 'true' | 'false'>('true');
  const [pagina, setPagina] = useState(1);
  const [descargando, setDescargando] = useState<string | null>(null);

  // Búsqueda con retardo para no golpear la API en cada tecla.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusquedaAplicada(busqueda);
      setPagina(1);
    }, 350);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: [
      'tarjetas',
      { busquedaAplicada, fechaDesde, fechaHasta, estado, pagina },
    ],
    queryFn: () =>
      tarjetasApi.listar({
        search: busquedaAplicada,
        fechaDesde,
        fechaHasta,
        activa: estado,
        page: pagina,
        limit: LIMITE,
      }),
    placeholderData: keepPreviousData,
  });

  const alDescargarPdf = async (tarjeta: Tarjeta) => {
    setDescargando(tarjeta.id);
    try {
      await tarjetasApi.descargarPdf(tarjeta.id, tarjeta.nroTarjetaSocial);
    } finally {
      setDescargando(null);
    }
  };

  const meta = data?.meta;

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>Tarjetas registradas</h1>
          <p className="subtitulo mt-0">
            Busca por paciente, Nº de tarjeta o Nº de historia clínica
          </p>
        </div>
        <Link to="/tarjetas/nueva" className="btn btn--primario">
          <Icono nombre="mas" />
          Nueva tarjeta
        </Link>
      </div>

      <div className="panel">
        <div className="panel__filtros">
          <div className="campo campo--buscador">
            <label htmlFor="buscador">Buscar</label>
            <input
              id="buscador"
              type="search"
              placeholder="Ej.: Pérez Juan, 153, HC-00123…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="desde">Desde</label>
            <input
              id="desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          <div className="campo">
            <label htmlFor="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          <div className="campo">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as '' | 'true' | 'false');
                setPagina(1);
              }}
            >
              <option value="true">Activas</option>
              <option value="false">Desactivadas</option>
              <option value="">Todas</option>
            </select>
          </div>
        </div>

        {isPending ? (
          <Cargando texto="Buscando tarjetas…" />
        ) : isError ? (
          <div className="tabla-vacia" role="alert">
            <span className="glifo">!</span>
            {error instanceof ApiError
              ? error.message
              : 'No se pudo cargar el listado'}
          </div>
        ) : data.data.length === 0 ? (
          <div className="tabla-vacia">
            <span className="glifo">§</span>
            No se encontraron tarjetas con esos criterios.
          </div>
        ) : (
          <>
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nº Tarjeta</th>
                    <th>Paciente</th>
                    <th>Procedencia</th>
                    <th>Inscripción</th>
                    <th>Estado</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((tarjeta) => (
                    <tr
                      key={tarjeta.id}
                      onClick={() => navigate(`/tarjetas/${tarjeta.id}`)}
                    >
                      <td className="folio-celda">
                        {tarjeta.nroTarjetaSocial}
                      </td>
                      <td className="paciente-celda">
                        <strong>
                          {tarjeta.paciente.apellidoPaterno}{' '}
                          {tarjeta.paciente.apellidoMaterno},{' '}
                          {tarjeta.paciente.nombres}
                        </strong>
                        <span>
                          {tarjeta.paciente.nroHistoriaClinica
                            ? `H.C. ${tarjeta.paciente.nroHistoriaClinica}`
                            : 'Sin historia clínica'}
                        </span>
                      </td>
                      <td>{tarjeta.paciente.procedencia}</td>
                      <td className="nowrap">
                        {formatearFecha(tarjeta.fechaInscripcion)}
                      </td>
                      <td>
                        <span
                          className={`insignia ${
                            tarjeta.activa
                              ? 'insignia--activa'
                              : 'insignia--inactiva'
                          }`}
                        >
                          {tarjeta.activa ? 'Activa' : 'Desactivada'}
                        </span>
                      </td>
                      <td
                        className="acciones-celda"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn btn--fantasma btn--chico"
                          onClick={() => void alDescargarPdf(tarjeta)}
                          disabled={descargando === tarjeta.id}
                          title="Descargar PDF"
                        >
                          <Icono nombre="pdf" />
                          {descargando === tarjeta.id ? 'Generando…' : 'PDF'}
                        </button>
                        <Link
                          to={`/tarjetas/${tarjeta.id}/editar`}
                          className="btn btn--fantasma btn--chico"
                          title="Editar"
                        >
                          <Icono nombre="editar" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="paginacion">
                <span className="paginacion__info">
                  {meta.total} tarjeta{meta.total === 1 ? '' : 's'} · página{' '}
                  {meta.page} de {meta.totalPages}
                </span>
                <div className="paginacion__controles">
                  <button
                    type="button"
                    className="btn btn--secundario btn--chico"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => p - 1)}
                  >
                    <Icono nombre="izquierda" />
                    Anterior
                  </button>
                  <span className="paginacion__pagina">
                    {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn--secundario btn--chico"
                    disabled={pagina >= meta.totalPages}
                    onClick={() => setPagina((p) => p + 1)}
                  >
                    Siguiente
                    <Icono nombre="derecha" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
