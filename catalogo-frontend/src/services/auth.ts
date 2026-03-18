const API_URL = "http://127.0.0.1:8000/api";

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
    const txt = await res.text();
    throw new Error(`Login falló: ${res.status} ${txt}`);
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
