import { getAccessToken, refreshAccessToken, logout } from "./auth";

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  const first = await fetch(input, { ...init, headers });

  if (first.status !== 401) return first;

  try {
    const newAccess = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${newAccess}`);
    return await fetch(input, { ...init, headers });
  } catch (e) {
    logout();
    throw e;
  }
}
