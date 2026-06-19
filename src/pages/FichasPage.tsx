import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fichasApi } from '../api';
import { ApiError } from '../api/client';
import { CATEGORIAS, type Categoria } from '../api/types';
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

export function FichasPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estado, setEstado] = useState<'' | 'true' | 'false'>('true');
  const [categoria, setCategoria] = useState<Categoria | ''>('');
  const [pagina, setPagina] = useState(1);

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
      'fichas',
      { busquedaAplicada, fechaDesde, fechaHasta, estado, categoria, pagina },
    ],
    queryFn: () =>
      fichasApi.listar({
        search: busquedaAplicada,
        categoria,
        fechaDesde,
        fechaHasta,
        activa: estado,
        page: pagina,
        limit: LIMITE,
      }),
    placeholderData: keepPreviousData,
  });

  const meta = data?.meta;

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>Fichas registradas</h1>
          <p className="subtitulo mt-0">
            Busca por paciente, Nº de ficha o Nº de historia clínica
          </p>
        </div>
        <Link to="/fichas/nueva" className="btn btn--primario">
          <Icono nombre="mas" />
          Nueva ficha
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
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value as Categoria | '');
                setPagina(1);
              }}
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
          <Cargando texto="Buscando fichas…" />
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
            No se encontraron fichas con esos criterios.
          </div>
        ) : (
          <>
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nº Ficha</th>
                    <th>Paciente</th>
                    <th>Categoría</th>
                    <th>Puntaje</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((ficha) => (
                    <tr
                      key={ficha.id}
                      onClick={() => navigate(`/fichas/${ficha.id}`)}
                    >
                      <td className="folio-celda">{ficha.nroFichaSocial}</td>
                      <td className="paciente-celda">
                        <strong>
                          {ficha.paciente.apellidoPaterno}{' '}
                          {ficha.paciente.apellidoMaterno},{' '}
                          {ficha.paciente.nombres}
                        </strong>
                        <span>
                          {ficha.paciente.nroHistoriaClinica
                            ? `H.C. ${ficha.paciente.nroHistoriaClinica}`
                            : 'Sin historia clínica'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`insignia insignia--categoria-${ficha.puntajes.categoria.toLowerCase()}`}
                        >
                          {ficha.puntajes.categoria}
                        </span>
                      </td>
                      <td className="nowrap">
                        {ficha.puntajes.puntajeBasico}
                      </td>
                      <td className="nowrap">
                        {formatearFecha(ficha.fechaInscripcion)}
                      </td>
                      <td>
                        <span
                          className={`insignia ${
                            ficha.activa
                              ? 'insignia--activa'
                              : 'insignia--inactiva'
                          }`}
                        >
                          {ficha.activa ? 'Activa' : 'Desactivada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="paginacion">
                <span className="paginacion__info">
                  {meta.total} ficha{meta.total === 1 ? '' : 's'} · página{' '}
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
