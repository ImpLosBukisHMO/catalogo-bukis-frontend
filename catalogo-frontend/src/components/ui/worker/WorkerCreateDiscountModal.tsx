import { useState } from "react";
import { sanitizeInput } from "../../../utils/sanitizer";
import { useCrearDescuento, useWorkerTiposDescuento } from "../../../queries/workerDescuentos";
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

export type WorkerCreateDiscountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkerCreateDiscountModal({ open, onOpenChange }: WorkerCreateDiscountModalProps) {
  const { data: tiposDescuento = [] } = useWorkerTiposDescuento();
  const tiposDescArray = tiposDescuento;

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("general");
  const [porcentaje, setPorcentaje] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const crearDescuentoM = useCrearDescuento();
  const isPending = crearDescuentoM.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNombre = sanitizeInput(nombre);

    if (!cleanNombre) {
      setErrorMsg("El nombre del descuento es requerido.");
      return;
    }
    if (porcentaje === "" || porcentaje <= 0) {
      setErrorMsg("El porcentaje debe ser mayor a 0.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setErrorMsg("Las fechas de inicio y fin son requeridas.");
      return;
    }

    const dInicio = new Date(fechaInicio);
    const dFin = new Date(fechaFin);
    if (dFin <= dInicio) {
      setErrorMsg("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }

    crearDescuentoM.mutate(
      {
        nombre: cleanNombre,
        tipo,
        porcentaje: Number(porcentaje),
        activo,
        fecha_inicio: dInicio,
        fecha_fin: dFin,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // reset form state on successful creation
          setNombre("");
          setTipo("general");
          setPorcentaje("");
          setFechaInicio("");
          setFechaFin("");
          setActivo(true);
        },
        onError: (err: unknown) => {
          const apiError = err as { response?: { data?: { message?: string } }; message?: string };
          setErrorMsg(apiError?.response?.data?.message || apiError?.message || "Ocurrió un error al crear el descuento.");
        },
      }
    );
  };

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
              <WorkerDialogTitle>Nuevo Descuento</WorkerDialogTitle>
              <WorkerDialogDescription>
                Crea un nuevo descuento o promoción aplicable a tus productos.
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
          <form id="create-discount-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {errorMsg && <InlineNotice tone="critical">{errorMsg}</InlineNotice>}
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="d-nombre" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>Nombre</label>
              <input
                id="d-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Hot Sale 2026"
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
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <label htmlFor="d-tipo" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>Tipo</label>
                <select
                  id="d-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
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
                  {tiposDescArray.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <label htmlFor="d-porcentaje" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>Porcentaje (%)</label>
                <input
                  id="d-porcentaje"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej: 15"
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
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <label htmlFor="d-inicio" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>Fecha de Inicio</label>
                <input
                  id="d-inicio"
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
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
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <label htmlFor="d-fin" style={{ fontSize: 13, fontWeight: 600, color: "var(--worker-ink)" }}>Fecha de Fin</label>
                <input
                  id="d-fin"
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
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
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <input
                id="d-activo"
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                disabled={isPending}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="d-activo" style={{ fontSize: 14, color: "var(--worker-ink)", cursor: "pointer", fontWeight: 500 }}>
                {activo ? "Habilitar descuento inmediatamente (haga clic para deshabilitar)." : "Descuento deshabilitado (haga clic para habilitar)."}
              </label>
            </div>
          </form>
        </WorkerDialogBody>

        <WorkerDialogFooter>
          <ModalButton kind="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </ModalButton>
          <ModalButton kind="primary" type="submit" form="create-discount-form" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Descuento"}
          </ModalButton>
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}
