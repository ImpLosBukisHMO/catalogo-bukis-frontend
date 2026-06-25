/**
 * workerProducts — React Query hooks for worker product/variant workflows.
 *
 * PR 3 scope: useWorkerVariants (dashboard-needed subset).
 * PR 4 scope: full product/category/color/upload mutation hooks for
 *   WorkerProductsPage.
 *
 * Invalidation contract:
 *   - Product mutations → invalidate productos() + variantsList() + dashboard()
 *   - Variant mutations → invalidate variants() + dashboard()
 *   - Color/category mutations → invalidate their own key only (catalog data)
 *   - Upload mutations → invalidate uploads(productoId) + variantsList()
 *
 * No backend contract changes — uses src/services/worker.ts wrappers only.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  crearCategoria,
  crearColor,
  crearProducto,
  crearVariante,
  editarProducto,
  editarVariante,
  getWorkerCategorias,
  getWorkerColores,
  getWorkerProductos,
  getWorkerProductosSlim,
  getWorkerVariants,
  subirImagen,
} from "../services/worker";
import type { WorkerCreatedVariant, WorkerUploadedImage } from "../services/worker";
import { workerKeys } from "./workerKeys";
import type { WorkerProducto } from "../types/worker";

// ─── useWorkerVariants ────────────────────────────────────────────────────────

/**
 * Fetches the full worker variant list.
 *
 * Used by:
 *   - WorkerDashboardPage: derives low-stock / out-of-stock summaries.
 *   - WorkerProductsPage: powers the searchable/filterable variant grid.
 *
 * @param filters.productoId Optional — scope to variants of one product.
 *   The key still includes the filter object so cached entries are distinct.
 *
 * - placeholderData: keepPreviousData — ensures existing variant data stays
 *   visible during background refreshes triggered by order mutations.
 */
export function useWorkerVariants(filters?: { productoId?: number }) {
  return useQuery({
    queryKey: workerKeys.variantsList(filters),
    queryFn: () => getWorkerVariants(),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// ─── useWorkerProductos ───────────────────────────────────────────────────────

/**
 * Fetches the worker product list (full WorkerProducto objects).
 * Used by WorkerProductsPage for the utility drawer "Crear Variante" selector.
 */
export function useWorkerProductos(enabled: boolean) {
  return useQuery({
    queryKey: workerKeys.productosList(),
    queryFn: getWorkerProductos,
    enabled,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── useWorkerProductosSlim ───────────────────────────────────────────────────

/**
 * Fetches a slim product list (id + nombre) from the public /api/productos/ endpoint.
 * Used by the variant creation drawer to populate the product selector.
 * Enabled only when the drawer is open to avoid unnecessary fetches.
 */
export function useWorkerProductosSlim(enabled: boolean) {
  return useQuery({
    queryKey: [...workerKeys.productos(), "slim"] as const,
    queryFn: getWorkerProductosSlim,
    enabled,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── useWorkerCategorias ─────────────────────────────────────────────────────

/**
 * Fetches all categories. Used for:
 *   - Category filter in the variant table.
 *   - Category selector in the product creation form in the utility drawer.
 */
export function useWorkerCategorias() {
  return useQuery({
    queryKey: workerKeys.categories(),
    queryFn: getWorkerCategorias,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── useWorkerColores ─────────────────────────────────────────────────────────

/**
 * Fetches all colors. Used by the variant creation form in the utility drawer.
 * Enabled only when the drawer is open.
 */
export function useWorkerColores(enabled: boolean) {
  return useQuery({
    queryKey: workerKeys.colors(),
    queryFn: getWorkerColores,
    enabled,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── useEditarVariante ────────────────────────────────────────────────────────

/**
 * Patches a variant's stock and/or activo fields.
 * On success: invalidates variantsList() and dashboard() so the grid and
 * dashboard stock summaries reflect the change without a full reload.
 */
export function useEditarVariante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      data,
    }: {
      variantId: number;
      data: { stock?: number; activo?: boolean; item?: string, precio?: number | null, codigo_barras?: string };
    }) => editarVariante(variantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.variants() });
      qc.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
  });
}

// ─── useCrearProducto ─────────────────────────────────────────────────────────

/**
 * Creates a new product via multipart form data.
 * On success: invalidates productosList(), variantsList() (for dashboard),
 * and dashboard() so stock/product summaries stay fresh.
 */
export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => crearProducto(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.productos() });
      qc.invalidateQueries({ queryKey: workerKeys.variants() });
      qc.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
  });
}

// ─── useEditarProducto ───────────────────────────────────────────────────────

/**
 * Updates a product base via multipart form data.
 * On success: invalidates productosList(), variantsList(), and dashboard().
 */
export function useEditarProducto() {
  const qc = useQueryClient();
  return useMutation<
    WorkerProducto,
    Error,
    { productId: number; data: FormData }
  >({
    mutationFn: ({ productId, data }) => editarProducto(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.productos() });
      qc.invalidateQueries({ queryKey: workerKeys.variants() });
      qc.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
  });
}

// ─── useCrearVariante ─────────────────────────────────────────────────────────

/**
 * Creates a new variant under a given product.
 * On success: invalidates variantsList() and dashboard().
 */
export function useCrearVariante() {
  const qc = useQueryClient();
  return useMutation<
    WorkerCreatedVariant,
    Error,
    {
      productoId: number;
      data: { color: number; stock: number; activo: boolean; item?: string };
    }
  >({
    mutationFn: ({
      productoId,
      data,
    }: {
      productoId: number;
      data: { color: number; stock: number; activo: boolean; item?: string };
    }) => crearVariante(productoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.variants() });
      qc.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
  });
}

// ─── useSubirImagen ───────────────────────────────────────────────────────────

/**
 * Uploads a product image (multipart).
 * On success: invalidates uploads(productoId) and variantsList() so the
 * grid thumbnails (imagen_principal) refresh after upload.
 */
export function useSubirImagen() {
  const qc = useQueryClient();
  return useMutation<
    WorkerUploadedImage,
    Error,
    {
      productoId: number;
      data: FormData;
    }
  >({
    mutationFn: ({
      productoId,
      data,
    }: {
      productoId: number;
      data: FormData;
    }) => subirImagen(productoId, data),
    onSuccess: (_data, { productoId }) => {
      qc.invalidateQueries({ queryKey: workerKeys.uploads(productoId) });
      qc.invalidateQueries({ queryKey: workerKeys.variants() });
    },
  });
}

// ─── useCrearColor ────────────────────────────────────────────────────────────

/**
 * Creates a new color entry.
 * On success: invalidates colors() so the variant creation form refreshes.
 */
export function useCrearColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; hex: string; disponible: boolean }) =>
      crearColor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.colors() });
    },
  });
}

// ─── useCrearCategoria ────────────────────────────────────────────────────────

/**
 * Creates a new category entry.
 * On success: invalidates categories() so the filter and product form refresh.
 */
export function useCrearCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crearCategoria(nombre),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.categories() });
    },
  });
}
