import type { PedidoResumen, PedidoDetalle } from "../types/pedido";
import { apiFetch } from "./apiFetch";

const API_URL = "http://127.0.0.1:8000/api";

function toJsonError(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { detail: txt };
  }
}

export async function getMisPedidos(): Promise<PedidoResumen[]> {
  const res = await apiFetch(`${API_URL}/mis-pedidos/`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }
  return res.json();
}

export async function getMiPedidoDetalle(id: number): Promise<PedidoDetalle> {
  const res = await apiFetch(`${API_URL}/mis-pedidos/${id}/`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(JSON.stringify(toJsonError(txt)));
  }
  return res.json();
}
