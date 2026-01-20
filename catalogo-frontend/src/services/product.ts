// src/services/product.ts
import type { Product, ProductDetail } from "../types/product";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8000";

async function requestJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}). ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  const url = `${API_BASE}/api/productos/`;
  return requestJSON<Product[]>(url);
}

export async function getProductById(id: string | number): Promise<ProductDetail> {
  const url = `${API_BASE}/api/productos/${id}/`;
  return requestJSON<ProductDetail>(url);
}

/* =========================
   IMAGENES (esto es lo que faltaba)
   ========================= */

export type ProductImage = {
  id: number;
  imagen: string; // URL
  es_principal?: boolean;
  orden?: number;
  producto?: number | null;
  variante?: number | null;
};

export async function getProductImages(params: {
  producto?: number | string;
  variante?: number | string;
}): Promise<ProductImage[]> {
  const qs = new URLSearchParams();

  if (params.producto != null) qs.set("producto", String(params.producto));
  if (params.variante != null) qs.set("variante", String(params.variante));

  // Endpoint esperado por tu ProductoPage
  // Si tu backend usa otro path, aquí se cambia (solo aquí).
  const url = `${API_BASE}/api/productos-imagenes/?${qs.toString()}`;

  return requestJSON<ProductImage[]>(url);
}
