import type { WorkerVariant, WorkerPedido, WorkerPedidoDetalle, WorkerProducto } from "../types/worker";
import API from "../api";
import { normalizeResponse } from "../components/pages/responseNormalizer";
import type { Discount } from "../types/descuento";
import type { BannerOfertaPublic, BannerOfertaWorker, UpdateBannerOfertaMeta } from "../types/bannerOferta";

export async function getWorkerVariants(): Promise<WorkerVariant[]> {
  const res = await API.get("/api/worker/variants/");
  return normalizeResponse<WorkerVariant>(res.data);
}

export async function getWorkerPedidos(estado?: string): Promise<WorkerPedido[]> {
  const url = estado ? `/api/worker/pedidos/?estado=${estado}` : "/api/worker/pedidos/";
  const res = await API.get(url);
  return normalizeResponse<WorkerPedido>(res.data);
}

export async function getWorkerPedidoDetalle(id: number): Promise<WorkerPedidoDetalle> {
  const res = await API.get(`/api/worker/pedidos/${id}/`);
  const data = res.data;
  return data?.datos || data;
}

export async function cambiarEstadoPedido(
  id: number,
  estado: string,
  extra?: { nota_worker?: string; denegado_razon?: string }
): Promise<WorkerPedido> {
  const res = await API.patch(`/api/worker/pedidos/${id}/cambiar-estado/`, { estado, ...extra });
  const data = res.data;
  return data?.datos || data;
}

export async function getWorkerProductos(): Promise<WorkerProducto[]> {
  const res = await API.get("/api/worker/productos/");
  const data = res.data;
  return Array.isArray(data) ? data : (data?.datos || data?.results || []);
}

export async function getWorkerProducto(id: number): Promise<WorkerProducto> {
  const res = await API.get(`/api/worker/productos/${id}/`);
  const resData = res.data;
  return resData?.datos || resData;
}

export async function crearProducto(data: FormData): Promise<WorkerProducto> {
  const res = await API.post("/api/worker/productos/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const resData = res.data;
  return resData?.datos || resData;
}

export async function editarProducto(id: number, data: FormData): Promise<WorkerProducto> {
  const res = await API.patch(`/api/worker/productos/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const resData = res.data;
  return resData?.datos || resData;
}

export type WorkerCreatedVariant = {
  id: number;
  item: string;
  codigo_barras: string;
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
  data: { color: number; stock: number; activo: boolean; item?: string; codigo_barras?: string }
): Promise<WorkerCreatedVariant> {
  const res = await API.post(`/api/worker/productos/${productoId}/variantes/`, data);
  const resData = res.data;
  return resData?.datos || resData;
}

export async function subirImagen(productoId: number, data: FormData): Promise<WorkerUploadedImage> {
  const res = await API.post(`/api/worker/productos/${productoId}/imagenes/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const resData = res.data;
  return resData?.datos || resData;
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export async function editarVariante(
  variantId: number,
  data: { stock?: number; activo?: boolean; item?: string; precio?: number | null; }
): Promise<unknown> {
  const res = await API.patch(`/api/worker/variants/${variantId}/`, data);
  const resData = res.data;
  return resData?.datos || resData;
}

// ─── Categories (public endpoint used by worker utility drawer) ───────────────

export type WorkerCategoria = { id: number; nombre: string; descuento_general?: number | null };

export async function getWorkerCategorias(): Promise<WorkerCategoria[]> {
  const res = await API.get("/api/categorias/");
  const data = res.data;
  return normalizeResponse<WorkerCategoria>(data);
}

export async function crearCategoria(nombre: string): Promise<WorkerCategoria> {
  const res = await API.post("/api/categorias/", { nombre });
  const data = res.data;
  return data?.datos || data;
}

export async function asignarDescuentoCategoria(categoriaId: number, descuentoId: number | null): Promise<WorkerCategoria> {
  const res = await API.patch(`/api/categorias/${categoriaId}/`, { descuento_general: descuentoId });
  const data = res.data;
  return data?.datos || data;
}

export async function asignarDescuentoProducto(productoId: number, descuentoId: number | null): Promise<WorkerProducto> {
  const res = await API.patch(`/api/worker/productos/${productoId}/`, { descuento_especial: descuentoId });
  const data = res.data;
  return data?.datos || data;
}

// ─── Colors (public endpoint used by worker utility drawer) ───────────────────

export type WorkerColor = { id: number; nombre: string; hex: string; disponible?: boolean };

export async function getWorkerColores(): Promise<WorkerColor[]> {
  const res = await API.get("/api/colores/");
  const data = res.data;
  return normalizeResponse<WorkerColor>(data);
}

export async function crearColor(data: {
  nombre: string;
  hex: string;
  disponible: boolean;
}): Promise<WorkerColor> {
  const res = await API.post("/api/colores/", data);
  const resData = res.data;
  return resData?.datos || resData;
}

// ─── Productos list (public endpoint used by variant creation drawer) ─────────

export type WorkerProductoSlim = { id: number; nombre: string };

export async function getWorkerProductosSlim(): Promise<WorkerProductoSlim[]> {
  // Cambiamos al endpoint de worker para que el creador vea todos los productos base
  const res = await API.get("/api/worker/productos/");
  return normalizeResponse<WorkerProductoSlim>(res.data);
}

// ─── Descuentos list (worker endpoint for private use) ────────────────────────────────────
export async function getWorkerDescuentos(): Promise<Discount[]> {
  const res = await API.get("/api/worker/descuentos/");
  return normalizeResponse<Discount>(res.data);
}

export async function getWorkerDescuentoById(id: number): Promise<Discount> {
  const res = await API.get(`/api/worker/descuentos/${id}/`)
  return res.data
}

export async function getWorkerTiposDescuento(): Promise<string[]> {
  const res = await API.get("/api/worker/descuentos/tipos/");
  return res.data?.datos || res.data;
}

export async function editarDescuento(
  id: number, 
  data: { nombre?: string; tipo?: string; porcentaje?: number; activo?: boolean; fecha_inicio?: Date; fecha_fin?: Date; }
): Promise<unknown> {
  const res = await API.patch(`/api/worker/descuentos/${id}/`, data);
  return res.data?.datos || res.data;
}

export async function crearDescuento(
  data: { nombre: string; tipo: string; porcentaje: number; activo: boolean; fecha_inicio: string | Date; fecha_fin: string | Date; }
): Promise<Discount> {
  const res = await API.post(`/api/worker/descuentos/`, data);
  return res.data?.datos || res.data;
}

export async function getWorkerBannerOfertas(): Promise<BannerOfertaWorker[]> {
  const res = await API.get("/api/worker/banner-ofertas/");
  return normalizeResponse<BannerOfertaWorker>(res.data);
}

export async function crearBannerOferta(data: FormData): Promise<BannerOfertaWorker> {
  const res = await API.post("/api/worker/banner-ofertas/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return (res.data?.datos || res.data) as BannerOfertaWorker;
}

export async function editarBannerOferta(
  id: number,
  data: FormData | UpdateBannerOfertaMeta,
): Promise<BannerOfertaWorker> {
  const isMultipart = data instanceof FormData;

  const res = await API.patch(`/api/worker/banner-ofertas/${id}/`, data, isMultipart
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined);

  return (res.data?.datos || res.data) as BannerOfertaWorker;
}

export async function borrarBannerOferta(id: number): Promise<void> {
  await API.delete(`/api/worker/banner-ofertas/${id}/`);
}

export async function toggleActivoBannerOferta(
  id: number,
  activo: boolean,
): Promise<BannerOfertaPublic> {
  const res = await API.patch(`/api/worker/banner-ofertas/${id}/`, { activo });
  return (res.data?.datos || res.data) as BannerOfertaPublic;
}

export async function reordenarBannerOferta(
  id: number,
  orden: number,
): Promise<BannerOfertaWorker> {
  const res = await API.patch(`/api/worker/banner-ofertas/${id}/`, { orden });
  return (res.data?.datos || res.data) as BannerOfertaWorker;
}
