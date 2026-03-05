import type { WorkerVariant, WorkerPedido, WorkerPedidoDetalle, WorkerProducto } from "../types/worker";
import { getAccessToken, refreshAccessToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function doFetch(url: string, options: RequestInit, accessToken: string | null) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
      ...options.headers,
    },
  });
}

async function requestJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  let access = getAccessToken();
  let res = await doFetch(url, options, access);

  if (res.status === 401) {
    try {
      access = await refreshAccessToken();
      res = await doFetch(url, options, access);
    } catch {
      // dejamos que truene abajo
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

async function requestFormData<T>(url: string, method: string, body: FormData): Promise<T> {
  let access = getAccessToken();

  const doReq = () =>
    fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: access ? `Bearer ${access}` : "",
      },
      body,
    });

  let res = await doReq();

  if (res.status === 401) {
    try {
      access = await refreshAccessToken();
      res = await doReq();
    } catch {
      // dejamos que truene abajo
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Variantes (catálogo) ───────────────────────────────────────
export async function getWorkerVariants(): Promise<WorkerVariant[]> {
  return requestJSON<WorkerVariant[]>(`${API_BASE}/api/worker/variants/`);
}

// ─── Pedidos ────────────────────────────────────────────────────
export async function getWorkerPedidos(estado?: string): Promise<WorkerPedido[]> {
  const url = estado
    ? `${API_BASE}/api/worker/pedidos/?estado=${estado}`
    : `${API_BASE}/api/worker/pedidos/`;
  return requestJSON<WorkerPedido[]>(url);
}

export async function getWorkerPedidoDetalle(id: number): Promise<WorkerPedidoDetalle> {
  return requestJSON<WorkerPedidoDetalle>(`${API_BASE}/api/worker/pedidos/${id}/`);
}

export async function cambiarEstadoPedido(
  id: number,
  estado: string,
  extra?: { nota_worker?: string; denegado_razon?: string }
): Promise<WorkerPedido> {
  return requestJSON<WorkerPedido>(`${API_BASE}/api/worker/pedidos/${id}/cambiar-estado/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado, ...extra }),
  });
}

// ─── Productos propios ──────────────────────────────────────────
export async function getWorkerProductos(): Promise<WorkerProducto[]> {
  return requestJSON<WorkerProducto[]>(`${API_BASE}/api/worker/productos/`);
}

export async function crearProducto(data: FormData): Promise<WorkerProducto> {
  return requestFormData<WorkerProducto>(`${API_BASE}/api/worker/productos/`, "POST", data);
}

export async function editarProducto(id: number, data: FormData): Promise<WorkerProducto> {
  return requestFormData<WorkerProducto>(`${API_BASE}/api/worker/productos/${id}/`, "PATCH", data);
}

export async function crearVariante(
  productoId: number,
  data: { color: number; stock: number; activo: boolean }
): Promise<unknown> {
  return requestJSON(`${API_BASE}/api/worker/productos/${productoId}/variantes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function subirImagen(productoId: number, data: FormData): Promise<unknown> {
  return requestFormData(`${API_BASE}/api/worker/productos/${productoId}/imagenes/`, "POST", data);
}
