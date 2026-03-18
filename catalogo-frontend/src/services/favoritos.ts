import type { FavoritoVariante } from "../types/favoritos";
import { apiFetch } from "./apiFetch";

const API_URL = "http://127.0.0.1:8000/api";

function toJsonError(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { detail: txt };
  }
}

export async function getFavoritos(): Promise<FavoritoVariante[]> {
  const res = await apiFetch(`${API_URL}/productos-favoritos/`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }
  return res.json();
}

export async function addFavorito(varianteId: number): Promise<FavoritoVariante> {
  const res = await apiFetch(`${API_URL}/productos-favoritos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variante_id: varianteId }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }
  return res.json();
}

export async function removeFavorito(favoritoId: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/productos-favoritos/${favoritoId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }
}
