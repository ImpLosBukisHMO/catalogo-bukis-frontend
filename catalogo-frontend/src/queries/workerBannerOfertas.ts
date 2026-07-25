import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  borrarBannerOferta,
  crearBannerOferta,
  editarBannerOferta,
  getWorkerBannerOfertas,
  reordenarBannerOferta,
  toggleActivoBannerOferta,
} from "../services/worker";
import type { BannerOfertaWorker, UpdateBannerOfertaInput } from "../types/bannerOferta";
import { publicBannerOfertasKey } from "./publicBannerOfertas";
import { workerKeys } from "./workerKeys";

type ReorderContext = {
  previous: BannerOfertaWorker[];
};

type ReorderResult = {
  succeeded: number[];
  failed: number[];
};

type ReorderError = Error & {
  details?: ReorderResult;
};

function sortByOrden(items: BannerOfertaWorker[]) {
  return [...items].sort((left, right) => left.orden - right.orden || left.id - right.id);
}

export function useWorkerBannerOfertas() {
  return useQuery({
    queryKey: workerKeys.bannerOfertas(),
    queryFn: getWorkerBannerOfertas,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useCreateBannerOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => crearBannerOferta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.bannerOfertas() });
      queryClient.invalidateQueries({ queryKey: publicBannerOfertasKey });
    },
  });
}

export function useUpdateBannerOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateBannerOfertaInput) => editarBannerOferta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.bannerOfertas() });
      queryClient.invalidateQueries({ queryKey: publicBannerOfertasKey });
    },
  });
}

export function useDeleteBannerOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => borrarBannerOferta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.bannerOfertas() });
      queryClient.invalidateQueries({ queryKey: publicBannerOfertasKey });
    },
  });
}

export function useToggleBannerOfertaActivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => toggleActivoBannerOferta(id, activo),
    onMutate: async ({ id, activo }) => {
      await queryClient.cancelQueries({ queryKey: workerKeys.bannerOfertas() });

      const previous = queryClient.getQueryData<BannerOfertaWorker[]>(workerKeys.bannerOfertas()) ?? [];

      queryClient.setQueryData<BannerOfertaWorker[]>(workerKeys.bannerOfertas(), (current = []) =>
        current.map((item) => (item.id === id ? { ...item, activo } : item)),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(workerKeys.bannerOfertas(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.bannerOfertas() });
      queryClient.invalidateQueries({ queryKey: publicBannerOfertasKey });
    },
  });
}

export function useReorderBannerOfertas() {
  const queryClient = useQueryClient();

  return useMutation<ReorderResult, ReorderError, Array<{ id: number; orden: number }>, ReorderContext>({
    mutationFn: async (rows) => {
      const settled = await Promise.allSettled(
        rows.map((row) => reordenarBannerOferta(row.id, row.orden).then(() => row.id)),
      );

      const details = settled.reduce<ReorderResult>((accumulator, result, index) => {
        const id = rows[index]?.id;
        if (typeof id !== "number") return accumulator;

        if (result.status === "fulfilled") {
          accumulator.succeeded.push(id);
        } else {
          accumulator.failed.push(id);
        }

        return accumulator;
      }, { succeeded: [], failed: [] });

      if (details.failed.length > 0) {
        const error = new Error("Partial reorder failure") as ReorderError;
        error.details = details;
        throw error;
      }

      return details;
    },
    onMutate: async (rows) => {
      await queryClient.cancelQueries({ queryKey: workerKeys.bannerOfertas() });

      const previous = queryClient.getQueryData<BannerOfertaWorker[]>(workerKeys.bannerOfertas()) ?? [];
      const ordenMap = new Map(rows.map((row) => [row.id, row.orden]));

      queryClient.setQueryData<BannerOfertaWorker[]>(workerKeys.bannerOfertas(), (current = []) =>
        sortByOrden(
          current.map((item) =>
            ordenMap.has(item.id) ? { ...item, orden: ordenMap.get(item.id) ?? item.orden } : item,
          ),
        ),
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (!context?.previous) return;

      if (!error.details?.failed?.length) {
        queryClient.setQueryData(workerKeys.bannerOfertas(), context.previous);
        return;
      }

      const previousById = new Map(context.previous.map((item) => [item.id, item]));

      queryClient.setQueryData<BannerOfertaWorker[]>(workerKeys.bannerOfertas(), (current = []) =>
        sortByOrden(
          current.map((item) =>
            error.details?.failed.includes(item.id) ? previousById.get(item.id) ?? item : item,
          ),
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.bannerOfertas() });
      queryClient.invalidateQueries({ queryKey: publicBannerOfertasKey });
    },
  });
}
