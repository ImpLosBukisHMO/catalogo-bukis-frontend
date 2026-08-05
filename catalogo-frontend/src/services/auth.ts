import { BACKEND_BASE_URL } from "../utils/backend";

const API_URL = `${BACKEND_BASE_URL}/api`;

export type AuthTokens = {
  mensaje: string;
};

export type MeUser = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  is_admin: boolean;
  is_staff: boolean;
  is_superuser: boolean;
};

export function isWorker(u: MeUser): boolean {
  return Boolean(u.is_staff || u.is_admin || u.is_superuser);
}

export async function login(correo: string, contrasena: string): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Permite recibir cookies
    body: JSON.stringify({ correo, password: contrasena }),
  });

  if (!res.ok) {
    let detail = `Login falló: ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch { /* body no es JSON, usar mensaje genérico */ }
    const err = new Error(detail) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const data = (await res.json()) as AuthTokens;
  return data;
}

export async function refreshAccessToken(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Envia el refresh_token cookie
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Refresh falló: ${res.status} ${txt}`);
  }
}

export function getAccessToken(): string | null {
  // Ya no aplica en el frontend
  return null;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/logout/`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error("Error al hacer logout en el backend", e);
  }
  localStorage.removeItem("me");
}

async function doFetch(url: string) {
  return fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "include", // Las cookies se envían solas
  });
}

export async function getMe(): Promise<MeUser> {
  const res = await doFetch(`${API_URL}/mi_usuario/`);

  if (!res.ok) {
    const err = new Error(`Me falló: ${res.status}`);
    (err as Error & { response?: { status?: number } }).response = { status: res.status };
    throw err;
  }

  const me = (await res.json()) as MeUser;

  // opcional: cache para no pegarle cada rato
  localStorage.setItem("me", JSON.stringify(me));

  return me;
}


export async function confirmAccount(correo: string, codigo: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_URL}/confirmar-cuenta/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, codigo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo confirmar la cuenta.");
  return data;
}


export async function reenviarConfirmacion(correo: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_URL}/reenviar-confirmacion/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo reenviar el correo.");
  return data;
}

export async function solicitarRecuperacionPassword(correo: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_URL}/recuperar-password/solicitar/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo solicitar la recuperación.");
  return data;
}

export async function confirmarRecuperacionPassword(correo: string, codigo: string, nueva_password: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_URL}/recuperar-password/confirmar/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, codigo, nueva_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo restablecer la contraseña.");
  return data;
}