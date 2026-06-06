/**
 * workerProducts — React Query hooks for worker product/variant workflows.
 *
 * PR 3 scope: implement the subset needed by WorkerDashboardPage.
 *   - useWorkerVariants: variants list (used for stock attention summaries).
 *
 * PR 4 scope (NOT implemented here): full product/category/color/upload hooks
 * for WorkerProductsPage.
 *
 * Invalidation contract:
 *   - useWorkerVariants does not own mutations in this file for PR 3.
 *   - When useCambiarEstadoPedido succeeds, it also invalidates dashboard(),
 *     which serves as the composition point for orders + variants summary data.
 *
 * No backend contract changes — uses existing src/services/worker.ts endpoints.
 */

import { useQuery } from "@tanstack/react-query";
import { getWorkerVariants } from "../services/worker";
import { workerKeys } from "./workerKeys";

// ─── useWorkerVariants ────────────────────────────────────────────────────────

/**
 * Fetches the full worker variant list.
 *
 * Used by:
 *   - WorkerDashboardPage: derives low-stock / out-of-stock summaries.
 *   - WorkerProductsPage (PR 4): powers the searchable/filterable variant grid.
 *
 * @param filters.productoId Optional — scope to variants of one product.
 *   When undefined, all variants are returned (backend does not filter by
 *   productoId on this endpoint; filtering happens client-side in PR 4).
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
