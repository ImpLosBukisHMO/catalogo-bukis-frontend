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

export type WorkerCreatedVariant = {
  id: number;
  item: string;
  color: number;
  stock: number;
  activo: boolean;
};

export type WorkerUploadedImage = {
  id: number;
  variante: number | null;
  imagen: string;
  orden: number;
  es_principal: boolean;
};

export async function crearVariante(
  productoId: number,
  data: { color: number; stock: number; activo: boolean; item?: string }
): Promise<WorkerCreatedVariant> {
  const res = await API.post(`/api/worker/productos/${productoId}/variantes/`, data);
  return res.data;
}

export async function subirImagen(productoId: number, data: FormData): Promise<WorkerUploadedImage> {
  const res = await API.post(`/api/worker/productos/${productoId}/imagenes/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export async function editarVariante(
  variantId: number,
  data: { stock?: number; activo?: boolean }
): Promise<unknown> {
  const res = await API.patch(`/api/producto-variantes/${variantId}/`, data);
  return res.data;
}

// ─── Categories (public endpoint used by worker utility drawer) ───────────────

export type WorkerCategoria = { id: number; nombre: string };

export async function getWorkerCategorias(): Promise<WorkerCategoria[]> {
  const res = await API.get("/api/categorias/");
  const data = res.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function crearCategoria(nombre: string): Promise<WorkerCategoria> {
  const res = await API.post("/api/categorias/", { nombre });
  return res.data;
}

// ─── Colors (public endpoint used by worker utility drawer) ───────────────────

export type WorkerColor = { id: number; nombre: string; hex: string; disponible?: boolean };

export async function getWorkerColores(): Promise<WorkerColor[]> {
  const res = await API.get("/api/colores/");
  const data = res.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function crearColor(data: {
  nombre: string;
  hex: string;
  disponible: boolean;
}): Promise<WorkerColor> {
  const res = await API.post("/api/colores/", data);
  return res.data;
}

// ─── Productos list (public endpoint used by variant creation drawer) ─────────

export type WorkerProductoSlim = { id: number; nombre: string };

export async function getWorkerProductosSlim(): Promise<WorkerProductoSlim[]> {
  const res = await API.get("/api/productos/");
  const data = res.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
}
