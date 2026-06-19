import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Icono } from './components/Icono';

export function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/fichas" className="app-header__marca">
            <span className="app-header__hospital">
              Hospital «Daniel A. Carrión»
            </span>
            <span className="app-header__servicio">Trabajo Social</span>
          </NavLink>

          <nav className="app-header__nav" aria-label="Principal">
            <NavLink
              to="/fichas"
              className={({ isActive }) => (isActive ? 'activo' : '')}
              end
            >
              Fichas
            </NavLink>
            <NavLink
              to="/fichas/nueva"
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              Nueva ficha
            </NavLink>
            {usuario?.rol === 'ADMIN' && (
              <NavLink
                to="/usuarios"
                className={({ isActive }) => (isActive ? 'activo' : '')}
              >
                Usuarios
              </NavLink>
            )}
          </nav>

          <div className="app-header__usuario">
            <div className="app-header__nombre">
              <strong>{usuario?.nombre}</strong>
              <span className="app-header__rol">
                {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Trabajo social'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn--fantasma btn--chico"
              onClick={() => navigate('/cambiar-password')}
              title="Cambiar contraseña"
            >
              <Icono nombre="candado" />
            </button>
            <button
              type="button"
              className="btn btn--secundario btn--chico"
              onClick={() => logout()}
            >
              <Icono nombre="salir" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
