import type { CarritoResponse } from "../types/carrito";

const API_URL = "http://127.0.0.1:8000/api";

function getAccessToken(): string | null {
  return localStorage.getItem("access");
}

export async function getCarritoActual(): Promise<CarritoResponse> {
  const token = getAccessToken();
  if (!token) throw new Error("No hay access token. Inicia sesión.");

  const res = await fetch(`${API_URL}/carrito/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error ${res.status}: ${txt}`);
  }

  return res.json();
}
