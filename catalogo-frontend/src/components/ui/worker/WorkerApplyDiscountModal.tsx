import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  WorkerDialogRoot,
  WorkerDialogContent,
  WorkerDialogHeader,
  WorkerDialogTitle,
  WorkerDialogDescription,
  WorkerDialogBody,
  WorkerDialogFooter,
} from "./WorkerDialog";
import { ModalButton, InlineNotice } from "./WorkerCreateProductModal";
import { getWorkerCategorias, asignarDescuentoCategoria, asignarDescuentoProducto } from "../../../services/worker";
import { useWorkerDescuentos } from "../../../queries/workerDescuentos";
import { useWorkerProductos } from "../../../queries/workerProducts";
import type { Discount } from "../../../types/descuento";
import { normalizeResponse } from "../../pages/responseNormalizer";

export type WorkerApplyDiscountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoDescuento: "general" | "especial";
};

export function WorkerApplyDiscountModal({ open, onOpenChange, tipoDescuento }: WorkerApplyDiscountModalProps) {
  const queryClient = useQueryClient();
  const [selectedTargetId, setSelectedTargetId] = useState<number | "">("");
  const [selectedDescuento, setSelectedDescuento] = useState<number | "">("");
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: categorias = [], isLoading: loadingCat } = useQuery({
    queryKey: ["worker", "categorias"],
    queryFn: getWorkerCategorias,
  });

  const { data: productos = [], isLoading: loadingProd } = useWorkerProductos(true);

  const productosBase = useMemo(() => {
    return Array.from(productos).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  const { data: descuentosRaw = [], isLoading: loadingDesc } = useWorkerDescuentos();

  const descuentos = useMemo(() => {
    const arr = normalizeResponse(descuentosRaw) as Discount[];
    return arr.filter(d => d.tipo.toLowerCase() === tipoDescuento && d.activo);
  }, [descuentosRaw, tipoDescuento]);

  // ── Detect existing discount ──────────────────────────────────────────────
  // For "general" mode: check if selected category has a discount (descuento field is a number/id)
  // For "especial" mode: check if selected product has a descuento id
  const descuentoVigente = useMemo<{ nombre: string; porcentaje: number } | null>(() => {
    if (!selectedTargetId) return null;

    const allDescuentos = normalizeResponse(descuentosRaw) as Discount[];

    if (tipoDescuento === "general") {
      const cat = categorias.find(c => c.id === selectedTargetId);
      if (!cat || !cat.descuento) return null;
      const disc = allDescuentos.find(d => d.id === cat.descuento);
      return disc ? { nombre: disc.nombre, porcentaje: Number(disc.porcentaje) } : null;
    } else {
      const prod = productosBase.find(p => p.id === selectedTargetId);
      if (!prod || !prod.descuento) return null;
      const disc = allDescuentos.find(d => d.id === prod.descuento);
      return disc ? { nombre: disc.nombre, porcentaje: Number(disc.porcentaje) } : null;
    }
  }, [selectedTargetId, categorias, productosBase, descuentosRaw, tipoDescuento]);

  const handleTargetChange = (id: number | "") => {
    setSelectedTargetId(id);
    setConfirmarReemplazo(false);
    setErrorMsg(null);
  };

  const applyMutation = useMutation({
    mutationFn: async (vars: { targetId: number; descId: number }) => {
      if (tipoDescuento === "general") {
        return asignarDescuentoCategoria(vars.targetId, vars.descId);
      } else {
        return asignarDescuentoProducto(vars.targetId, vars.descId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker", "categorias"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "variants"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "productos"] });
      onOpenChange(false);
      setSelectedTargetId("");
      setSelectedDescuento("");
      setConfirmarReemplazo(false);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err.message || "Ocurrió un error al aplicar el descuento.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedTargetId || !selectedDescuento) {
      setErrorMsg(`Debes seleccionar un${tipoDescuento === "general" ? "a categoría" : " producto"} y un descuento.`);
      return;
    }
    if (descuentoVigente && !confirmarReemplazo) {
      setErrorMsg("Confirma que deseas reemplazar el descuento vigente.");
      return;
    }
    applyMutation.mutate({ targetId: Number(selectedTargetId), descId: Number(selectedDescuento) });
  };

  const isPending = applyMutation.isPending || loadingCat || loadingDesc || loadingProd;
  const entityLabel = tipoDescuento === "general" ? "categoría" : "producto";

  return (
    <WorkerDialogRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <WorkerDialogContent size="md">
        <WorkerDialogHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <WorkerDialogTitle>Aplicar Descuento {tipoDescuento.charAt(0).toUpperCase() + tipoDescuento.slice(1)}</WorkerDialogTitle>
              <WorkerDialogDescription>
                {tipoDescuento === "general"
                  ? "Selecciona la categoría a la cual se le aplicará el descuento."
                  : "Selecciona el producto al cual se le aplicará el descuento."}
              </WorkerDialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              style={{
                background: "none",
                border: "1px solid var(--worker-border-soft)",
                fontSize: 20,
                lineHeight: 1,
                color: isPending ? "var(--worker-ink-muted)" : "var(--worker-ink-tertiary)",
                cursor: isPending ? "not-allowed" : "pointer",
                padding: "6px 10px",
                borderRadius: 10,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </WorkerDialogHeader>

        <WorkerDialogBody scrollable>
          <form id="apply-discount-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {errorMsg && <InlineNotice tone="critical">{errorMsg}</InlineNotice>}

            {/* Selector de categoría o producto */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor={tipoDescuento === "general" ? "cat-select" : "prod-select"}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}
              >
                {tipoDescuento === "general" ? "Categoría" : "Producto"}
              </label>
              <select
                id={tipoDescuento === "general" ? "cat-select" : "prod-select"}
                value={selectedTargetId}
                onChange={(e) => handleTargetChange(e.target.value ? Number(e.target.value) : "")}
                disabled={isPending}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--worker-border)",
                  fontSize: 14,
                  background: "var(--worker-bench)",
                  color: "var(--worker-ink)",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <option value="">{tipoDescuento === "general" ? "Selecciona una categoría" : "Selecciona un producto base"}</option>
                {tipoDescuento === "general"
                  ? categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))
                  : productosBase.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))
                }
              </select>
            </div>

            {/* Aviso de descuento vigente */}
            {descuentoVigente && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid var(--worker-warning-border, #d97706)",
                  background: "var(--worker-warning-bg, #fffbeb)",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--worker-warning-fg, #92400e)" }}>
                      Este {entityLabel} ya tiene un descuento vigente
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--worker-warning-fg, #92400e)" }}>
                      <strong>{descuentoVigente.nombre}</strong> — {descuentoVigente.porcentaje}% de descuento
                    </p>
                  </div>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--worker-ink)",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={confirmarReemplazo}
                    onChange={(e) => {
                      setConfirmarReemplazo(e.target.checked);
                      setErrorMsg(null);
                    }}
                    disabled={isPending}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--worker-accent)" }}
                  />
                  Sí, quiero reemplazar el descuento actual
                </label>
              </div>
            )}

            {/* Selector de descuento */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="desc-select" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>
                Nuevo Descuento
              </label>
              <select
                id="desc-select"
                value={selectedDescuento}
                onChange={(e) => setSelectedDescuento(e.target.value ? Number(e.target.value) : "")}
                disabled={isPending}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--worker-border)",
                  fontSize: 14,
                  background: "var(--worker-bench)",
                  color: "var(--worker-ink)",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <option value="">Selecciona un descuento</option>
                {descuentos.map((d) => (
                  <option key={d.id} value={d.id}>{`[${tipoDescuento.toUpperCase()}] ${d.nombre} (${d.porcentaje} %)`}</option>
                ))}
              </select>
            </div>

            {descuentos.length === 0 && !loadingDesc && (
              <p style={{ fontSize: 13, color: "var(--worker-error-fg)", margin: 0 }}>
                No hay descuentos activos de tipo {tipoDescuento}. Por favor, crea uno primero.
              </p>
            )}

          </form>
        </WorkerDialogBody>

        <WorkerDialogFooter>
          <ModalButton kind="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </ModalButton>
          <ModalButton
            kind="primary"
            type="submit"
            form="apply-discount-form"
            disabled={isPending || descuentos.length === 0 || (!!descuentoVigente && !confirmarReemplazo)}
          >
            {applyMutation.isPending ? "Aplicando..." : "Aplicar Descuento"}
          </ModalButton>
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}
