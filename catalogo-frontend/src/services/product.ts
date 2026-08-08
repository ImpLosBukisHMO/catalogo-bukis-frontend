import API from "../api";
import {
  normalizePagedResponse,
  type PagedResponse,
} from "../components/pages/responseNormalizer";
import type { Product } from "../types/product";

export type GetProductsPageParams = {
  page?: number;
  query?: string;
};

function normalizeRequestedPage(page?: number): number {
  if (!Number.isFinite(page) || !page || page < 1) return 1;
  return Math.floor(page);
}

function buildProductsUrl(params?: GetProductsPageParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(normalizeRequestedPage(params?.page)));

  const query = params?.query?.trim();
  if (query) {
    searchParams.set("query", query);
  }

  return `/api/productos/?${searchParams.toString()}`;
}

export async function getProductsPage(
  params?: GetProductsPageParams,
): Promise<PagedResponse<Product>> {
  const res = await API.get(buildProductsUrl(params));
  return normalizePagedResponse<Product>(res.data);
}

/**
 * Fetches a flat public product list for discovery surfaces.
 *
 * The backend endpoint `/api/productos/` returns a DRF PageNumberPagination
 * response: `{ count, next, previous, results }` (backend issue #37,
 * PR catalogo-bukis-backend#39). Older versions returned a bare array.
 *
 * `normalizeResponse` handles both shapes, so this function always returns
 * `Product[]`. Pagination metadata (`count`, `next`, `previous`) is intentionally
 * dropped here — this helper remains for Home and ProductPage, which stay flat.
 *
 * Search experiences that need pagination metadata should call
 * `getProductsPage()` instead of this helper.
 */
export async function getProducts() {
  const pagedResponse = await getProductsPage({ page: 1 });
  return pagedResponse.items;
}

export async function getProductById(id: string | number) {
  const res = await API.get(`/api/productos/${id}/`);
  const data = res.data;
  return data?.datos || data;
}

export async function getNovedades(): Promise<Product[]> {
  const res = await API.get("/api/productos/novedades/");
  return res.data;
}

export async function getMasVistos(): Promise<Product[]> {
  const res = await API.get("/api/productos/mas-vistos/");
  return res.data;
}

export async function getMasVendidos(): Promise<Product[]> {
  const res = await API.get("/api/productos/mas-vendidos/");
  return res.data;
}

export async function reportProductView(id: string | number): Promise<void> {
  try {
    await API.post(`/api/productos/${id}/ver/`);
  } catch (error) {
    console.error("Error al reportar vista de producto:", error);
  }
}

export type ProductImage = {
  id: number;
  producto: number;
  variante: number | null;
  imagen: string;
  orden: number;
  es_principal: boolean;
  created_at: string;
  updated_at: string;
};

export async function getProductImages(params: {
  producto?: number;
  variante?: number;
}): Promise<ProductImage[]> {
  const qs = new URLSearchParams();
  if (params.producto !== undefined) qs.set("producto", String(params.producto));
  if (params.variante !== undefined) qs.set("variante", String(params.variante));

  const res = await API.get(`/api/productos-imagenes/?${qs.toString()}`);
  return res.data;
}
