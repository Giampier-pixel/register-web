import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Cargando } from './components/Cargando';
import { Layout } from './Layout';
import { CambiarPasswordPage } from './pages/CambiarPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { TarjetaDetallePage } from './pages/TarjetaDetallePage';
import { TarjetaFormPage } from './pages/TarjetaFormPage';
import { TarjetasPage } from './pages/TarjetasPage';
import { UsuariosPage } from './pages/UsuariosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

function RequiereSesion() {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return <Cargando texto="Restaurando sesión…" />;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function SoloAdmin() {
  const { usuario } = useAuth();
  if (usuario?.rol !== 'ADMIN') {
    return <Navigate to="/tarjetas" replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequiereSesion />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/tarjetas" replace />} />
                <Route path="/tarjetas" element={<TarjetasPage />} />
                <Route path="/tarjetas/nueva" element={<TarjetaFormPage />} />
                <Route path="/tarjetas/:id" element={<TarjetaDetallePage />} />
                <Route
                  path="/tarjetas/:id/editar"
                  element={<TarjetaFormPage />}
                />
                <Route
                  path="/cambiar-password"
                  element={<CambiarPasswordPage />}
                />
                <Route element={<SoloAdmin />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/tarjetas" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
