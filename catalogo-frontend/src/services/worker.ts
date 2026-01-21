import type { WorkerVariant, WorkerPedido } from "../types/worker";
import { getAccessToken, refreshAccessToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function doFetch(url: string, accessToken: string | null) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });
}

async function requestJSON<T>(url: string): Promise<T> {
  let access = getAccessToken();
  let res = await doFetch(url, access);

  // si expira el access, refrescamos y reintentamos una vez
  if (res.status === 401) {
    try {
      access = await refreshAccessToken();
      res = await doFetch(url, access);
    } catch {
      // dejamos que truene con el error original abajo
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getWorkerVariants(): Promise<WorkerVariant[]> {
  return requestJSON<WorkerVariant[]>(`${API_BASE}/api/worker/variants/`);
}

export async function getWorkerPedidos(): Promise<WorkerPedido[]> {
  return requestJSON<WorkerPedido[]>(`${API_BASE}/api/worker/pedidos/`);
}
