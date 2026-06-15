import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { usuariosApi } from '../api';
import { ApiError } from '../api/client';
import type { Rol, Usuario } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Cargando } from '../components/Cargando';
import { Icono } from '../components/Icono';
import { Modal } from '../components/Modal';

interface FormUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}

const FORM_VACIO: FormUsuario = {
  nombre: '',
  email: '',
  password: '',
  rol: 'TRABAJADOR_SOCIAL',
};

export function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<FormUsuario>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);

  const { data: usuarios, isPending } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosApi.listar,
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });

  const guardar = useMutation({
    mutationFn: () => {
      if (editando) {
        return usuariosApi.editar(editando.id, {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          ...(form.password.trim() !== '' && { password: form.password }),
        });
      }
      return usuariosApi.crear(form);
    },
    onSuccess: async () => {
      cerrarModal();
      await invalidar();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar'),
  });

  const cambiarEstado = useMutation({
    mutationFn: (objetivo: Usuario) =>
      objetivo.activo
        ? usuariosApi.desactivar(objetivo.id)
        : usuariosApi.activar(objetivo.id),
    onSuccess: invalidar,
  });

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setError(null);
    setCreando(true);
  };

  const abrirEditar = (objetivo: Usuario) => {
    setForm({
      nombre: objetivo.nombre,
      email: objetivo.email,
      password: '',
      rol: objetivo.rol,
    });
    setError(null);
    setEditando(objetivo);
  };

  const cerrarModal = () => {
    setCreando(false);
    setEditando(null);
    setError(null);
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate();
  };

  const abierto = creando || editando !== null;

  return (
    <>
      <div className="pagina-cabecera">
        <div>
          <h1>Usuarios</h1>
          <p className="subtitulo mt-0">
            Cuentas del personal de Trabajo Social
          </p>
        </div>
        <button type="button" className="btn btn--primario" onClick={abrirCrear}>
          <Icono nombre="mas" />
          Nuevo usuario
        </button>
      </div>

      <div className="panel">
        {isPending ? (
          <Cargando texto="Cargando usuarios…" />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {(usuarios ?? []).map((u) => (
                  <tr key={u.id} onClick={() => abrirEditar(u)}>
                    <td>
                      <strong>{u.nombre}</strong>
                      {u.id === yo?.id && (
                        <span className="texto-suave"> (tú)</span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`insignia ${
                          u.rol === 'ADMIN' ? 'insignia--admin' : 'insignia--ts'
                        }`}
                      >
                        {u.rol === 'ADMIN' ? 'Administrador' : 'Trab. social'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`insignia ${
                          u.activo ? 'insignia--activa' : 'insignia--inactiva'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td
                      className="acciones-celda"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn--fantasma btn--chico"
                        onClick={() => abrirEditar(u)}
                      >
                        <Icono nombre="editar" />
                        Editar
                      </button>
                      {u.id !== yo?.id && (
                        <button
                          type="button"
                          className={`btn btn--chico ${
                            u.activo ? 'btn--peligro' : 'btn--secundario'
                          }`}
                          onClick={() => cambiarEstado.mutate(u)}
                          disabled={cambiarEstado.isPending}
                        >
                          <Icono nombre="apagar" />
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        titulo={editando ? `Editar a ${editando.nombre}` : 'Nuevo usuario'}
        abierto={abierto}
        alCerrar={cerrarModal}
      >
        <form
          onSubmit={alEnviar}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {error && (
            <div className="alerta alerta--error" role="alert">
              <Icono nombre="alerta" />
              {error}
            </div>
          )}
          <div className="campo">
            <label htmlFor="u-nombre">
              Nombre completo <span className="req">*</span>
            </label>
            <input
              id="u-nombre"
              required
              minLength={2}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="u-email">
              Correo electrónico <span className="req">*</span>
            </label>
            <input
              id="u-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="u-password">
              {editando ? 'Nueva contraseña' : 'Contraseña'}{' '}
              {!editando && <span className="req">*</span>}
            </label>
            <input
              id="u-password"
              type="password"
              required={!editando}
              minLength={8}
              autoComplete="new-password"
              placeholder={editando ? 'Dejar vacía para no cambiarla' : ''}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <span className="ayuda">Mínimo 8 caracteres.</span>
          </div>
          <div className="campo">
            <label>
              Rol <span className="req">*</span>
            </label>
            <div className="chips">
              {(
                [
                  ['TRABAJADOR_SOCIAL', 'Trabajador social'],
                  ['ADMIN', 'Administrador'],
                ] as const
              ).map(([valor, etiqueta]) => (
                <label key={valor} className="chip-opcion">
                  <input
                    type="radio"
                    name="rol"
                    checked={form.rol === valor}
                    onChange={() => setForm({ ...form, rol: valor })}
                  />
                  <span>{etiqueta}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal__pie" style={{ padding: 0 }}>
            <button
              type="button"
              className="btn btn--secundario"
              onClick={cerrarModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primario"
              disabled={guardar.isPending}
            >
              {guardar.isPending
                ? 'Guardando…'
                : editando
                  ? 'Guardar cambios'
                  : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
