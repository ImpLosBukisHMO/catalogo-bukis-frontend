import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { editarDescuento, getWorkerDescuentos, crearDescuento, getWorkerTiposDescuento } from "../services/worker";
import { workerKeys } from "./workerKeys";


// ─── useWorkerDescuentos ────────────────────────────────────────────────────────────

/**
 * Fetches all discounts.
 */
export function useWorkerDescuentos() {
  return useQuery({
    queryKey: workerKeys.discounts(),
    queryFn: getWorkerDescuentos,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}


// ─── useEditarDescuento ────────────────────────────────────────────────────────

/**
 * Patches a discount's fields.
 * On success: invalidates discountsList() and dashboard() so the grid and
 * dashboard stock summaries reflect the change without a full reload.
 */
export function useEditarDescuento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { nombre?: string; tipo?: string; porcentaje?: number; activo?: boolean; fecha_inicio?: Date; fecha_fin?: Date; };
    }) => editarDescuento(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.discounts() });
      qc.invalidateQueries({ queryKey: workerKeys.dashboard() });
    },
  });
}

// ─── useCrearDescuento ────────────────────────────────────────────────────────

/**
 * Creates a new discount.
 */
export function useCrearDescuento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      nombre: string;
      tipo: string;
      porcentaje: number;
      activo: boolean;
      fecha_inicio: string | Date;
      fecha_fin: string | Date;
    }) => crearDescuento(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workerKeys.discounts() });
    },
  });
}

// ─── useTiposDescuento ────────────────────────────────────────────────────────

/**
 * Fetches discount types.
 */
export const useWorkerTiposDescuento = () => {
  return useQuery({
    queryKey: ["worker", "tiposDescuentos"],
    queryFn: getWorkerTiposDescuento,
    staleTime: 1000 * 60 * 5
  });
}