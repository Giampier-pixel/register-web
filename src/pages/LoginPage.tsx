import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Icono } from '../components/Icono';

export function LoginPage() {
  const { usuario, login, aviso } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/fichas" replace />;
  }

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo iniciar sesión',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-fondo">
      <div className="login-caja">
        <div className="login-membrete">
          <div className="cruz" aria-hidden="true">
            +
          </div>
          <div className="hospital">Hospital «Daniel A. Carrión»</div>
          <h1>Fichas de Trabajo Social</h1>
        </div>

        <form className="login-tarjeta" onSubmit={alEnviar}>
          {aviso && !error && <div className="alerta alerta--info">{aviso}</div>}
          {error && (
            <div className="alerta alerta--error" role="alert">
              <Icono nombre="alerta" />
              {error}
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@hospital.gob.pe"
              autoFocus
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primario"
            disabled={enviando}
            style={{ justifyContent: 'center' }}
          >
            {enviando ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-pie">
          Registro digital de la ficha de Trabajo Social · acceso restringido
          al personal autorizado
        </p>
      </div>
    </div>
  );
}
