import type { WorkerVariant, WorkerPedido, WorkerPedidoDetalle, WorkerProducto } from "../types/worker";
import API from "../api";

export async function getWorkerVariants(): Promise<WorkerVariant[]> {
  const res = await API.get("/api/worker/variants/");
  return res.data;
}

export async function getWorkerPedidos(estado?: string): Promise<WorkerPedido[]> {
  const url = estado ? `/api/worker/pedidos/?estado=${estado}` : "/api/worker/pedidos/";
  const res = await API.get(url);
  return res.data;
}

export async function getWorkerPedidoDetalle(id: number): Promise<WorkerPedidoDetalle> {
  const res = await API.get(`/api/worker/pedidos/${id}/`);
  return res.data;
}

export async function cambiarEstadoPedido(
  id: number,
  estado: string,
  extra?: { nota_worker?: string; denegado_razon?: string }
): Promise<WorkerPedido> {
  const res = await API.patch(`/api/worker/pedidos/${id}/cambiar-estado/`, { estado, ...extra });
  return res.data;
}

export async function getWorkerProductos(): Promise<WorkerProducto[]> {
  const res = await API.get("/api/worker/productos/");
  return res.data;
}

export async function crearProducto(data: FormData): Promise<WorkerProducto> {
  const res = await API.post("/api/worker/productos/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function editarProducto(id: number, data: FormData): Promise<WorkerProducto> {
  const res = await API.patch(`/api/worker/productos/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function crearVariante(
  productoId: number,
  data: { color: number; stock: number; activo: boolean; item?: string }
): Promise<unknown> {
  const res = await API.post(`/api/worker/productos/${productoId}/variantes/`, data);
  return res.data;
}

export async function subirImagen(productoId: number, data: FormData): Promise<unknown> {
  const res = await API.post(`/api/worker/productos/${productoId}/imagenes/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
