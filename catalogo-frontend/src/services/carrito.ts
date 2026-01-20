// src/services/carrito.ts
import type { CarritoResponse } from "../types/carrito";
import { apiFetch } from "./apiFetch";

const API_URL = "http://127.0.0.1:8000/api";

function toJsonError(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { detail: txt };
  }
}

export async function getCarritoActual(): Promise<CarritoResponse> {
  const res = await apiFetch(`${API_URL}/carrito/`);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }

  return (await res.json()) as CarritoResponse;
}

export async function addItem(variante_id: number, cantidad: number) {
  const res = await apiFetch(`${API_URL}/carrito/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variante_id, cantidad }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }

  return await res.json();
}

export async function updateItemCantidad(item_id: number, cantidad: number) {
  const res = await apiFetch(`${API_URL}/carrito/items/${item_id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cantidad }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }

  return await res.json();
}

export async function deleteItem(item_id: number) {
  const res = await apiFetch(`${API_URL}/carrito/items/${item_id}/`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }

  return true;
}
