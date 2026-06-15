# Web — Sistema de Tarjetas de Trabajo Social

Frontend del sistema de tarjetas de trabajo social del Hospital
"Daniel A. Carrión". Consume la API NestJS de la carpeta raíz.

**Stack:** Vite 8 · React 19 · TypeScript 6 (strict) · React Router 7 ·
TanStack Query 5 · React Hook Form 7. Tipografías autohospedadas
(Fraunces + Public Sans, vía Fontsource) — funciona sin internet.

## Puesta en marcha

1. La API debe estar corriendo (ver `../README.md`).
2. Revisa el `.env` (ya existe; hay un `.env.example` de referencia):

   ```env
   VITE_API_URL=http://localhost:3000   # URL de la API
   VITE_INACTIVITY_MINUTES=30           # cierre de sesión por inactividad (RF-004)
   ```

3. Instala y arranca:

   ```bash
   npm install
   npm run dev      # desarrollo en http://localhost:5173
   ```

   Para producción: `npm run build` (genera `dist/`, listo para Vercel o
   cualquier hosting estático) y `npm run preview` para probar el build.

## Qué incluye

- **Login** con JWT; la sesión se restaura al recargar (`GET /auth/me`) y
  se cierra sola tras `VITE_INACTIVITY_MINUTES` sin actividad o si la API
  devuelve 401 (p. ej. cuenta desactivada).
- **Listado de tarjetas** con búsqueda en vivo (ignora mayúsculas y
  tildes: "perez" encuentra "Pérez"), filtros por rango de fecha de
  inscripción y estado, paginación y descarga de PDF por fila.
- **Formulario de ficha** (crear y editar) con las 14 secciones de la
  tarjeta física: chips tipo radio/checkbox para los enums, validación y
  folio automático mostrado al guardar.
- **Detalle** con vista tipo documento, descarga del PDF y
  desactivar/reactivar con confirmación (nunca se borra: soft delete).
- **Gestión de usuarios** (solo ADMIN): crear, editar, resetear
  contraseña, desactivar/reactivar. La ruta está protegida por rol.
- **Cambiar contraseña** del propio usuario.

## Estructura de `src/`

| Carpeta / archivo | Contenido |
|---|---|
| `api/` | Cliente HTTP (`client.ts`), endpoints (`index.ts`) y tipos del dominio (`types.ts`) |
| `auth/` | `AuthContext` — sesión, token en `localStorage`, timer de inactividad |
| `pages/` | Login, listado, formulario, detalle, usuarios y cambio de contraseña |
| `components/` | `Modal`, `Icono`, `Cargando` |
| `Layout.tsx` | Cabecera, navegación y avisos de sesión |
| `App.tsx` | Rutas + guards (`RequiereSesion`, `SoloAdmin`) |
| `styles/global.css` | Sistema de diseño "expediente clínico" (papel + verde institucional) |

## Notas técnicas

- Los enums del dominio son **arrays `const`** en `types.ts`, no `enum`
  de TS: la plantilla de Vite usa `erasableSyntaxOnly`.
- Por `verbatimModuleSyntax`, los tipos se importan con `import type`.
- Las fechas sin hora se muestran en hora de Perú (`America/Lima`),
  igual que en la API, para que el día no se corra según la zona horaria
  de la máquina.

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Desarrollo con recarga |
| `npm run build` | Type-check + build a `dist/` |
| `npm run preview` | Servir el build localmente |
| `npm run lint` | ESLint |
