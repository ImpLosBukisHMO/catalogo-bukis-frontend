/**
 * workerOrders — React Query hooks for worker order workflows.
 *
 * Invalidation contract (spec: worker-panel-server-state):
 * - cambiarEstadoPedido success:
 *     1. Invalidate workerKeys.pedidos() (all order lists, all filtered variants).
 *     2. Invalidate workerKeys.pedidoDetail(id) (force fresh detail).
 *     3. Invalidate workerKeys.dashboard() (queue summaries update).
 * - On mutation error: previous list and detail data are preserved by React
 *   Query's default behavior (no optimistic update that could be lost).
 *
 * No window.location.reload() or manual refetch with useEffect.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkerPedidos,
  getWorkerPedidoDetalle,
  cambiarEstadoPedido,
} from "../services/worker";
import { workerKeys } from "./workerKeys";

// ─── useWorkerPedidos ─────────────────────────────────────────────────────────

/**
 * Fetches the worker pedido list, optionally filtered by status.
 *
 * @param estado Optional status string (e.g. "PENDING"). Pass undefined for all orders.
 *
 * - placeholderData: keepPreviousData pattern — existing list stays visible while a
 *   new filter is loading, so UI does not flash to empty.
 * - Data is always an array; loading/error are surfaced via React Query states.
 */
export function useWorkerPedidos(estado?: string) {
  return useQuery({
    queryKey: workerKeys.pedidosList({ estado }),
    queryFn: () => getWorkerPedidos(estado),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// ─── useWorkerPedidoDetalle ───────────────────────────────────────────────────

/**
 * Fetches the full detail for one worker pedido.
 *
 * @param id Pedido id, or null when no order is selected.
 *
 * - Query is disabled when id is null; no request is made and the component
 *   receives { data: undefined, isLoading: false }.
 * - placeholderData: keepPreviousData — when switching between orders the last
 *   detail remains visible until the new one loads.
 */
export function useWorkerPedidoDetalle(id: number | null) {
  return useQuery({
    queryKey: workerKeys.pedidoDetail(id ?? -1),
    queryFn: () => getWorkerPedidoDetalle(id!),
    enabled: id !== null,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// ─── useCambiarEstadoPedido ───────────────────────────────────────────────────

/**
 * Mutation to transition a pedido through the fulfillment state machine.
 *
 * On success, invalidates:
 *   - workerKeys.pedidos() — all filtered/unfiltered order lists
 *   - workerKeys.pedidoDetail(id) — the specific detail that changed
 *   - workerKeys.dashboard() — queue pressure summaries derived from orders
 *
 * On error, no local state is reverted because no optimistic update was applied.
 * The previous cached data remains visible.
 *
 * Usage (from WorkerOrdersPage):
 *   const mutation = useCambiarEstadoPedido();
 *   mutation.mutate({ id, estado, extra });
 */
export function useCambiarEstadoPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      estado,
      extra,
    }: {
      id: number;
      estado: string;
      extra?: { nota_worker?: string; denegado_razon?: string };
    }) => cambiarEstadoPedido(id, estado, extra),

    onSuccess: (_data, variables) => {
      // Invalidate all order list variants (filtered + unfiltered).
      queryClient.invalidateQueries({ queryKey: workerKeys.pedidos() });
      // Invalidate the specific detail so it refetches with new status.
      queryClient.invalidateQueries({
        queryKey: workerKeys.pedidoDetail(variables.id),
      });
      // Invalidate dashboard-derived order summaries.
      queryClient.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
    // onError: no rollback — React Query preserves previous cache data by default.
  });
}
