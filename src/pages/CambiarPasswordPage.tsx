import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { ApiError } from '../api/client';
import { Icono } from '../components/Icono';

export function CambiarPasswordPage() {
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await authApi.cambiarPassword(actual, nueva);
      setExito(true);
      setTimeout(() => navigate('/fichas'), 1600);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cambiar la contraseña',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <div className="pagina-cabecera">
        <h1>Cambiar contraseña</h1>
      </div>

      <form
        className="login-tarjeta"
        onSubmit={(e) => void alEnviar(e)}
        style={{ animation: 'none' }}
      >
        {exito && (
          <div className="alerta alerta--info">
            Contraseña actualizada correctamente.
          </div>
        )}
        {error && (
          <div className="alerta alerta--error" role="alert">
            <Icono nombre="alerta" />
            {error}
          </div>
        )}

        <div className="campo">
          <label htmlFor="actual">Contraseña actual</label>
          <input
            id="actual"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="nueva">Nueva contraseña</label>
          <input
            id="nueva"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <span className="ayuda">Mínimo 8 caracteres.</span>
        </div>
        <div className="campo">
          <label htmlFor="confirmacion">Confirmar nueva contraseña</label>
          <input
            id="confirmacion"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
