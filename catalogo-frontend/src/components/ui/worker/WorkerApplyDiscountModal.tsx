import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { workerKeys } from "../../../queries/workerKeys";

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
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────
  // Uses workerKeys.categories() (["worker","categories"]) so invalidation after
  // applying a discount correctly refreshes this list and the warning banner.
  const { data: categorias = [], isLoading: loadingCat } = useQuery({
    queryKey: workerKeys.categories(),
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
  // For "general" mode: check if selected category has a discount assigned
  // (even if inactive/expired) so we warn the worker before overwriting it.
  // For "especial" mode: same check for the selected product.
  const descuentoVigente = useMemo<{ nombre: string; porcentaje: number } | null>(() => {
    if (!selectedTargetId) return null;

    const allDescuentos = normalizeResponse(descuentosRaw) as Discount[];

    if (tipoDescuento === "general") {
      const cat = categorias.find(c => c.id === selectedTargetId);
      if (!cat || !cat.descuento_general) return null;
      const disc = allDescuentos.find(d => d.id === Number(cat.descuento_general));
      return disc ? { nombre: disc.nombre, porcentaje: Number(disc.porcentaje) } : null;
    } else {
      const prod = productosBase.find(p => p.id === selectedTargetId);
      if (!prod || !prod.descuento_especial) return null;
      const disc = allDescuentos.find(d => d.id === Number(prod.descuento_especial));
      return disc ? { nombre: disc.nombre, porcentaje: Number(disc.porcentaje) } : null;
    }
  }, [selectedTargetId, categorias, productosBase, descuentosRaw, tipoDescuento]);

  const handleTargetChange = (id: number | "") => {
    setSelectedTargetId(id);
    setConfirmarReemplazo(false);
    setErrorMsg(null);
    if (id !== "" && tipoDescuento === "especial") {
      const prod = productosBase.find((p) => p.id === id);
      if (prod) {
        setProductSearchTerm(prod.nombre);
      }
    } else if (id === "") {
      setProductSearchTerm("");
    }
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
      // Invalidate using the canonical keys so all consumers (modal, products page, etc.)
      // see the fresh data without a manual reload.
      queryClient.invalidateQueries({ queryKey: workerKeys.categories() });
      queryClient.invalidateQueries({ queryKey: workerKeys.variants() });
      queryClient.invalidateQueries({ queryKey: workerKeys.productos() });
      onOpenChange(false);
      setSelectedTargetId("");
      setSelectedDescuento("");
      setConfirmarReemplazo(false);
    },
    onError: (err: unknown) => {
      const apiError = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(apiError?.response?.data?.message || apiError?.message || "Ocurrió un error al aplicar el descuento.");
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
        if (!nextOpen) {
          setSelectedTargetId("");
          setSelectedDescuento("");
          setConfirmarReemplazo(false);
          setErrorMsg(null);
          setProductSearchTerm("");
          setIsProductDropdownOpen(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <WorkerDialogContent>
        <WorkerDialogHeader>
          <WorkerDialogTitle>
            {tipoDescuento === "general"
              ? "Aplicar descuento general a categoría"
              : "Aplicar descuento especial a producto"}
          </WorkerDialogTitle>
          <WorkerDialogDescription>
            {tipoDescuento === "general"
              ? "Selecciona la categoría a la cual se le aplicará el descuento."
              : "Selecciona el producto al cual se le aplicará el descuento."}
          </WorkerDialogDescription>
        </WorkerDialogHeader>

        <WorkerDialogBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Selector de categoría / producto */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-bukis-ink">
                {tipoDescuento === "general" ? "Categoría" : "Producto"}
              </label>
              {tipoDescuento === "general" ? (
                <select
                  className="w-full rounded-lg border border-bukis-border bg-bukis-surface px-3 py-2 text-sm text-bukis-ink focus:outline-none focus:ring-2 focus:ring-bukis-accent"
                  value={selectedTargetId}
                  onChange={(e) => handleTargetChange(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={isPending}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-bukis-border bg-bukis-surface px-3 py-2 text-sm text-bukis-ink focus:outline-none focus:ring-2 focus:ring-bukis-accent"
                    placeholder="Buscar producto..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setIsProductDropdownOpen(true);
                      if (selectedTargetId !== "") {
                        setSelectedTargetId("");
                        setConfirmarReemplazo(false);
                        setErrorMsg(null);
                      }
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    disabled={isPending}
                  />
                  {isProductDropdownOpen && !isPending && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-bukis-border bg-bukis-surface shadow-lg">
                      {productosBase.filter(p => p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-neutral-500">No se encontraron productos</div>
                      ) : (
                        productosBase
                          .filter(p => p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()))
                          .map((prod) => (
                            <div
                              key={prod.id}
                              className="cursor-pointer px-3 py-2 text-sm text-bukis-ink hover:bg-neutral-100"
                              onClick={() => {
                                handleTargetChange(prod.id);
                                setIsProductDropdownOpen(false);
                              }}
                            >
                              {prod.nombre}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Aviso de descuento vigente */}
            {descuentoVigente && (
              <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  ⚠️ Este {entityLabel} ya tiene un descuento vigente
                </p>
                <p className="text-sm text-amber-700">
                  <strong>{descuentoVigente.nombre}</strong> — {descuentoVigente.porcentaje}% de descuento
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-amber-800">
                  <input
                    type="checkbox"
                    checked={confirmarReemplazo}
                    onChange={(e) => setConfirmarReemplazo(e.target.checked)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-amber-400 accent-amber-600"
                  />
                  Sí, quiero reemplazar el descuento actual
                </label>
              </div>
            )}

            {/* Selector de descuento */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-bukis-ink">Descuento a aplicar</label>
              {descuentos.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">
                  No hay descuentos de tipo «{tipoDescuento}» activos disponibles.
                </p>
              ) : (
                <select
                  className="w-full rounded-lg border border-bukis-border bg-bukis-surface px-3 py-2 text-sm text-bukis-ink focus:outline-none focus:ring-2 focus:ring-bukis-accent"
                  value={selectedDescuento}
                  onChange={(e) => setSelectedDescuento(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={isPending}
                >
                  <option value="">Selecciona un descuento</option>
                  {descuentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} — {d.porcentaje}%
                    </option>
                  ))}
                </select>
              )}
            </div>

            {errorMsg && <InlineNotice tone="error">{errorMsg}</InlineNotice>}

            <WorkerDialogFooter>
              <ModalButton
                type="button"
                kind="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </ModalButton>
              <ModalButton
                type="submit"
                kind="primary"
                disabled={isPending || descuentos.length === 0}
              >
                {isPending ? "Aplicando…" : "Aplicar descuento"}
              </ModalButton>
            </WorkerDialogFooter>
          </form>
        </WorkerDialogBody>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}
