import { useEffect, useMemo, useRef, useState } from "react";
import type { BannerOfertaWorker } from "../../types/bannerOferta";
import {
  useDeleteBannerOferta,
  useReorderBannerOfertas,
  useToggleBannerOfertaActivo,
  useWorkerBannerOfertas,
} from "../../queries/workerBannerOfertas";
import {
  WorkerDialogAction,
  WorkerDialogBody,
  WorkerDialogCancel,
  WorkerDialogContent,
  WorkerDialogDescription,
  WorkerDialogFooter,
  WorkerDialogHeader,
  WorkerDialogRoot,
  WorkerDialogTitle,
} from "../ui/worker/WorkerDialog";
import { WorkerBannerOfertaModal } from "../ui/worker/WorkerBannerOfertaModal";
import { BannerOfertaTable } from "./worker-banner-ofertas/BannerOfertaTable";

function getFetchErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("401") || error.message.includes("403")) {
      return "No autenticado. Inicia sesión como worker para gestionar banners.";
    }

    return error.message;
  }

  return "No se pudieron cargar los banners.";
}

export default function WorkerBannerOfertasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerOfertaWorker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerOfertaWorker | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const previousModalOpenRef = useRef(false);

  const { data = [], isLoading, isFetching, isError, error } = useWorkerBannerOfertas();
  const deleteMutation = useDeleteBannerOferta();
  const toggleMutation = useToggleBannerOfertaActivo();
  const reorderMutation = useReorderBannerOfertas();

  const items = useMemo(
    () => [...data].sort((left, right) => left.orden - right.orden || left.id - right.id),
    [data],
  );

  const activeCount = items.filter((item) => item.activo).length;

  useEffect(() => {
    if (!modalOpen && previousModalOpenRef.current) {
      createTriggerRef.current?.focus();
    }

    previousModalOpenRef.current = modalOpen;
  }, [modalOpen]);

  const handleCreate = () => {
    setEditingBanner(null);
    setActionError(null);
    setModalOpen(true);
  };

  const handleEdit = (banner: BannerOfertaWorker) => {
    setEditingBanner(banner);
    setActionError(null);
    setModalOpen(true);
  };

  const handleToggleActive = (banner: BannerOfertaWorker) => {
    setActionError(null);

    toggleMutation.mutate(
      { id: banner.id, activo: !banner.activo },
      {
        onError: () => {
          setActionError("No se pudo cambiar el estado. Inténtalo de nuevo.");
        },
      },
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setActionError(null);
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el banner.");
    }
  };

  const handleReorder = async (rows: Array<{ id: number; orden: number }>) => {
    setActionError(null);

    try {
      await reorderMutation.mutateAsync(rows);
    } catch (reorderError) {
      const failedCount = (reorderError as { details?: { failed?: number[] } })?.details?.failed?.length ?? 0;
      if (failedCount > 0) {
        setActionError(`${failedCount} cambios de orden fallaron. Se restauraron esas filas.`);
        return;
      }

      setActionError(reorderError instanceof Error ? reorderError.message : "No se pudo reordenar la lista.");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--worker-canvas)",
        color: "var(--worker-ink)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--worker-ink)" }}>
            Banner ofertas
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--worker-ink-secondary)" }}>
            Gestiona el orden, visibilidad y vigencia de los banners promocionales.
            {isFetching ? <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600 }}>↻ Actualizando…</span> : null}
          </p>
        </div>

        <button
          ref={createTriggerRef}
          type="button"
          onClick={handleCreate}
          aria-haspopup="dialog"
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "var(--worker-rail)",
            border: "none",
            borderRadius: 7,
            cursor: "pointer",
          }}
        >
          Crear banner
        </button>
      </div>

      {actionError ? (
        <div style={{ marginBottom: "1rem", padding: "10px 14px", background: "var(--worker-error-bg)", border: "1px solid var(--worker-error-border)", borderRadius: 7, fontSize: 13, color: "var(--worker-error-fg)" }}>
          {actionError}
        </div>
      ) : null}

      {isError ? (
        <div style={{ padding: "10px 14px", background: "var(--worker-error-bg)", border: "1px solid var(--worker-error-border)", borderRadius: 7, fontSize: 13, color: "var(--worker-error-fg)" }}>
          {getFetchErrorMessage(error)}
        </div>
      ) : null}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4].map((index) => (
            <div key={index} style={{ height: 52, borderRadius: 6, background: "var(--worker-bench)", opacity: 0.45 + index * 0.08 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 28, borderRadius: 10, border: "1px dashed var(--worker-border)", color: "var(--worker-ink-secondary)", background: "var(--worker-shelf)" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--worker-ink)" }}>Todavía no hay banners cargados.</p>
          <p style={{ margin: "8px 0 0", fontSize: 13 }}>Crea el primer banner para mostrar ofertas en la página principal.</p>
        </div>
      ) : (
        <BannerOfertaTable
          items={items}
          disabled={toggleMutation.isPending || reorderMutation.isPending || deleteMutation.isPending}
          onToggleActive={handleToggleActive}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onReorder={handleReorder}
        />
      )}

      {modalOpen ? (
        <WorkerBannerOfertaModal
          key={editingBanner?.id ?? "create"}
          open={modalOpen}
          onOpenChange={setModalOpen}
          banner={editingBanner}
          activeCount={activeCount}
        />
      ) : null}

      <WorkerDialogRoot open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}>
        <WorkerDialogContent destructive>
          <WorkerDialogHeader>
            <WorkerDialogTitle>Eliminar banner</WorkerDialogTitle>
            <WorkerDialogDescription>
              Esta acción eliminará el banner seleccionado y lo quitará del slider público.
            </WorkerDialogDescription>
          </WorkerDialogHeader>
          <WorkerDialogBody>
            {deleteTarget ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                Banner #{deleteTarget.id} · {deleteTarget.tipo === "video" ? "Video" : "Imagen"}
              </p>
            ) : null}
          </WorkerDialogBody>
          <WorkerDialogFooter>
            <WorkerDialogCancel>Cancelar</WorkerDialogCancel>
            <WorkerDialogAction destructive onClick={() => void handleDeleteConfirm()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
            </WorkerDialogAction>
          </WorkerDialogFooter>
        </WorkerDialogContent>
      </WorkerDialogRoot>
    </div>
  );
}
