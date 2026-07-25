import type { PedidoResumen, PedidoDetalle } from "../types/pedido";
import API from "../api";

export async function getMisPedidos(): Promise<PedidoResumen[]> {
  const res = await API.get("/api/mis-pedidos/");
  const data = res.data;
  return data?.datos || data?.results || (Array.isArray(data) ? data : []);
}

export async function getMiPedidoDetalle(id: number): Promise<PedidoDetalle> {
  const res = await API.get(`/api/mis-pedidos/${id}/`);
  return res.data;
}
