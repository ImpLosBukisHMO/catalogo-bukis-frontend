/**
 * workerKeys — Stable query key factory for the worker panel.
 *
 * Rules:
 * - Every key begins with the "worker" root so worker queries can be
 *   bulk-invalidated with queryClient.invalidateQueries({ queryKey: workerKeys.all }).
 * - No raw endpoint strings are used as keys.
 * - Filter objects are always included (even as empty objects) so filtered and
 *   unfiltered variants are cached independently.
 * - The dashboard key is kept separate so it can be invalidated without
 *   touching the full pedidos/variants caches — but callers are expected to
 *   also invalidate the underlying data keys after mutations.
 */

export const workerKeys = {
  /** Root invalidation key — invalidates everything worker-related. */
  all: ["worker"] as const,

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  /** Dashboard-composed summary key. */
  dashboard: () => [...workerKeys.all, "dashboard"] as const,

  // ─── Pedidos ───────────────────────────────────────────────────────────────
  /** Parent pedidos namespace — invalidates all pedido keys. */
  pedidos: () => [...workerKeys.all, "pedidos"] as const,

  /**
   * Filtered pedido list.
   * @param filters.estado Optional status filter string; undefined = all orders.
   */
  pedidosList: (filters: { estado?: string }) =>
    [...workerKeys.pedidos(), "list", filters] as const,

  /**
   * Single pedido detail.
   * @param id Pedido database id.
   */
  pedidoDetail: (id: number) =>
    [...workerKeys.pedidos(), "detail", id] as const,

  // ─── Productos ─────────────────────────────────────────────────────────────
  /** Parent productos namespace — invalidates all product keys. */
  productos: () => [...workerKeys.all, "productos"] as const,

  /** Full product list. */
  productosList: () => [...workerKeys.productos(), "list"] as const,

  /**
   * Single product detail.
   * @param id Product database id.
   */
  productoDetail: (id: number) =>
    [...workerKeys.productos(), "detail", id] as const,

  // ─── Variants ──────────────────────────────────────────────────────────────
  /** Parent variants namespace — invalidates all variant keys. */
  variants: () => [...workerKeys.all, "variants"] as const,

  /**
   * Variant list with optional product-scoped filter.
   * @param filters.productoId Optional product id to scope the variant list.
   */
  variantsList: (filters?: { productoId?: number }) =>
    [...workerKeys.variants(), "list", filters ?? {}] as const,

  // ─── Colors ────────────────────────────────────────────────────────────────
  /** Color list for variant creation. */
  colors: () => [...workerKeys.all, "colors"] as const,

  // ─── Categories ────────────────────────────────────────────────────────────
  /** Category list for product assignment. */
  categories: () => [...workerKeys.all, "categories"] as const,

  // ─── Uploads ───────────────────────────────────────────────────────────────
  /**
   * Image upload result key scoped to a product.
   * @param productoId Product whose images were uploaded.
   */
  uploads: (productoId: number) =>
    [...workerKeys.productos(), productoId, "uploads"] as const,
} as const;
