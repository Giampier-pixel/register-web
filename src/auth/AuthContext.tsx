import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api';
import {
  borrarToken,
  guardarToken,
  obtenerToken,
  registrarPerdidaDeSesion,
} from '../api/client';
import type { Usuario } from '../api/types';

const MINUTOS_INACTIVIDAD = Number(
  (import.meta.env.VITE_INACTIVITY_MINUTES as string | undefined) ?? '30',
);

interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  /** Mensaje informativo para la pantalla de login (sesión expirada, etc.). */
  aviso: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (aviso?: string) => void;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const ultimaActividad = useRef(Date.now());

  const logout = useCallback((mensaje?: string) => {
    borrarToken();
    setUsuario(null);
    setAviso(mensaje ?? null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user } = await authApi.login(email, password);
    guardarToken(accessToken);
    ultimaActividad.current = Date.now();
    setAviso(null);
    setUsuario(user);
  }, []);

  const refrescarUsuario = useCallback(async () => {
    setUsuario(await authApi.me());
  }, []);

  // Sesión perdida según la API (401): token vencido o cuenta desactivada.
  useEffect(() => {
    registrarPerdidaDeSesion(() =>
      logout('Tu sesión expiró. Vuelve a iniciar sesión.'),
    );
    return () => registrarPerdidaDeSesion(null);
  }, [logout]);

  // Restaura la sesión al recargar la página.
  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false);
      return;
    }
    authApi
      .me()
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  // RF-004: cierre de sesión automático por inactividad.
  useEffect(() => {
    if (!usuario) {
      return;
    }

    const marcarActividad = () => {
      ultimaActividad.current = Date.now();
    };
    const eventos = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ] as const;
    eventos.forEach((e) =>
      window.addEventListener(e, marcarActividad, { passive: true }),
    );

    const limite = MINUTOS_INACTIVIDAD * 60_000;
    const intervalo = window.setInterval(() => {
      if (Date.now() - ultimaActividad.current >= limite) {
        logout('Tu sesión se cerró por inactividad.');
      }
    }, 30_000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcarActividad));
      window.clearInterval(intervalo);
    };
  }, [usuario, logout]);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, aviso, login, logout, refrescarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
