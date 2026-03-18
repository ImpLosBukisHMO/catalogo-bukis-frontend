import type { PedidoResumen, PedidoDetalle } from "../types/pedido";
import API from "../api";

export async function getMisPedidos(): Promise<PedidoResumen[]> {
  const res = await API.get("/api/mis-pedidos/");
  return res.data;
}

export async function getMiPedidoDetalle(id: number): Promise<PedidoDetalle> {
  const res = await API.get(`/api/mis-pedidos/${id}/`);
  return res.data;
}
