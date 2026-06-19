const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000';

const TOKEN_KEY = 'tts.token';

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function borrarToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Avisa a la capa de auth cuando la API devuelve 401 (token vencido, cuenta desactivada…). */
let alPerderSesion: (() => void) | null = null;

export function registrarPerdidaDeSesion(fn: (() => void) | null): void {
  alPerderSesion = fn;
}

export class ApiError extends Error {
  status: number;
  detalles: string[];

  constructor(status: number, mensaje: string, detalles: string[] = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

async function aApiError(res: Response): Promise<ApiError> {
  let mensaje = `Error ${res.status}`;
  let detalles: string[] = [];
  try {
    const cuerpo = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(cuerpo.message)) {
      mensaje = 'Revisa los datos ingresados';
      detalles = cuerpo.message;
    } else if (typeof cuerpo.message === 'string') {
      mensaje = cuerpo.message;
    }
  } catch {
    /* respuesta sin JSON */
  }
  return new ApiError(res.status, mensaje, detalles);
}

async function pedir<T>(
  metodo: string,
  ruta: string,
  cuerpo?: unknown,
): Promise<T> {
  const token = obtenerToken();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (res.status === 401 && token && !ruta.startsWith('/auth/login')) {
    alPerderSesion?.();
  }

  if (!res.ok) {
    throw await aApiError(res);
  }

  return (await res.json()) as T;
}

export const http = {
  get: <T>(ruta: string) => pedir<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo: unknown) => pedir<T>('POST', ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo?: unknown) =>
    pedir<T>('PATCH', ruta, cuerpo ?? {}),
  delete: <T>(ruta: string) => pedir<T>('DELETE', ruta),
};

/** Descarga binaria autenticada. */
export async function descargarArchivo(
  ruta: string,
  nombreArchivo: string,
): Promise<void> {
  const token = obtenerToken();
  const res = await fetch(`${BASE_URL}${ruta}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status === 401 && token) {
    alPerderSesion?.();
  }
  if (!res.ok) {
    throw await aApiError(res);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
