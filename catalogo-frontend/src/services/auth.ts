const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

type TokenPair = { refresh: string; access: string };

export async function login(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Login failed");
  }

  const data = (await res.json()) as TokenPair;

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
}

export async function refreshAccess(): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Refresh failed");
  }

  const data = (await res.json()) as { access: string };
  localStorage.setItem("access", data.access);
  return data.access;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}
