const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}/api`;

export type AuthTokens = {
  access: string;
  refresh: string;
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

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No hay refresh token. Inicia sesión.");

  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Refresh falló: ${res.status} ${txt}`);
  }

  const data = (await res.json()) as { access: string };
  localStorage.setItem("access", data.access);
  return data.access;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access");
}

export function logout(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("me"); // opcional
  localStorage.removeItem("token");
}

async function doFetch(url: string, accessToken: string | null) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

export async function getMe(): Promise<MeUser> {
  let access = getAccessToken();
  let res = await doFetch(`${API_URL}/mi_usuario/`, access);

  if (res.status === 401) {
    access = await refreshAccessToken();
    res = await doFetch(`${API_URL}/mi_usuario/`, access);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Me falló: ${res.status} ${txt}`);
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