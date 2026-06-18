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
import { FichaDetallePage } from './pages/FichaDetallePage';
import { FichaFormPage } from './pages/FichaFormPage';
import { FichasPage } from './pages/FichasPage';
import { LoginPage } from './pages/LoginPage';
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
    return <Navigate to="/fichas" replace />;
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
                <Route path="/" element={<Navigate to="/fichas" replace />} />
                <Route path="/fichas" element={<FichasPage />} />
                <Route path="/fichas/nueva" element={<FichaFormPage />} />
                <Route path="/fichas/:id" element={<FichaDetallePage />} />
                <Route
                  path="/fichas/:id/editar"
                  element={<FichaFormPage />}
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
            <Route path="*" element={<Navigate to="/fichas" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
