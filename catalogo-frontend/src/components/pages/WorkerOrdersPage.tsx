/**
 * WorkerOrdersPage — Worker order triage and fulfillment flow.
 *
 * Data:
 *   - List: useWorkerPedidos (filtered by status, placeholderData=keep)
 *   - Detail: useWorkerPedidoDetalle (enabled when selectedId ≠ null)
 *   - Mutation: useCambiarEstadoPedido (invalidates list/detail/dashboard)
 *
 * UX:
 *   - WorkerDialog confirmation before executing consequential status changes.
 *   - No window.location.reload() or manual refetch via useEffect.
 *   - Status filter change → new query key → React Query fetches + keeps prev data.
 *   - On mutation success → form clears, dialog closes, invalidation refreshes.
 *   - On mutation error → error shown inside the dialog, dialog stays open.
 *
 * Styling: wk: Tailwind utilities + worker CSS variable tokens (no Bulma).
 * Fulfillment rail: selected item left border (#2), status change module (#3),
 *                   dialog accent (#5 via WorkerDialog destructive prop).
 */

import { useState } from "react";
import { useWorkerPedidos, useWorkerPedidoDetalle, useCambiarEstadoPedido } from "../../queries/workerOrders";
import { ESTADO_LABEL, TRANSICIONES_VALIDAS } from "../../types/worker";
import { getPedidoStatusColor, getPedidoStatusBg } from "../elements/workerTheme";
import {
  WorkerDialogRoot,
  WorkerDialogContent,
  WorkerDialogHeader,
  WorkerDialogTitle,
  WorkerDialogDescription,
  WorkerDialogBody,
  WorkerDialogFooter,
  WorkerDialogCancel,
  WorkerDialogAction,
} from "../ui/worker/WorkerDialog";

// ─── Status change confirmation dialog ────────────────────────────────────────

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: number;
  currentEstado: string;
  nuevoEstado: string;
  nota: string;
  razon: string;
  onNuevoEstadoChange: (v: string) => void;
  onNotaChange: (v: string) => void;
  onRazonChange: (v: string) => void;
  transicionesDisponibles: string[];
  onConfirm: () => void;
  isSaving: boolean;
  saveError: string | null;
}

function StatusChangeDialog({
  open,
  onOpenChange,
  currentEstado,
  nuevoEstado,
  nota,
  razon,
  onNuevoEstadoChange,
  onNotaChange,
  onRazonChange,
  transicionesDisponibles,
  onConfirm,
  isSaving,
  saveError,
}: StatusChangeDialogProps) {
  const isDestructive = nuevoEstado === "DENIED" || nuevoEstado === "CANCELED";
  const confirmDisabled =
    isSaving || !nuevoEstado || (nuevoEstado === "DENIED" && !razon.trim());

  const labelActual    = ESTADO_LABEL[currentEstado]  ?? currentEstado;
  const labelNuevo     = nuevoEstado ? (ESTADO_LABEL[nuevoEstado] ?? nuevoEstado) : "";

  return (
    <WorkerDialogRoot open={open} onOpenChange={onOpenChange}>
      <WorkerDialogContent destructive={isDestructive}>
        <WorkerDialogHeader>
          <WorkerDialogTitle>Cambiar estado del pedido</WorkerDialogTitle>
          <WorkerDialogDescription>
            Estado actual: <strong style={{ color: "var(--worker-ink)" }}>{labelActual}</strong>
            {nuevoEstado && (
              <>
                {" → "}
                <strong style={{ color: isDestructive ? "var(--worker-error-fg)" : "var(--worker-rail)" }}>
                  {labelNuevo}
                </strong>
              </>
            )}
          </WorkerDialogDescription>
        </WorkerDialogHeader>

        <WorkerDialogBody>
          <div className="wk:space-y-3">

            {/* Status selector */}
            <div className="wk:flex wk:flex-col wk:gap-1">
              <label
                htmlFor="dialog-nuevo-estado"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--worker-ink-secondary)" }}
              >
                Nuevo estado
              </label>
              <select
                id="dialog-nuevo-estado"
                value={nuevoEstado}
                onChange={(e) => onNuevoEstadoChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--worker-control-border)",
                  background: "var(--worker-control-bg)",
                  color: "var(--worker-ink)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Seleccionar estado…</option>
                {transicionesDisponibles.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABEL[e] ?? e}
                  </option>
                ))}
              </select>
            </div>

            {/* Denial reason (required for DENIED) */}
            {nuevoEstado === "DENIED" && (
              <div className="wk:flex wk:flex-col wk:gap-1">
                <label
                  htmlFor="dialog-razon"
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--worker-error-fg)" }}
                >
                  Razón del rechazo <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="dialog-razon"
                  value={razon}
                  onChange={(e) => onRazonChange(e.target.value)}
                  placeholder="Describe la razón del rechazo (obligatorio)"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1px solid var(--worker-error-border)",
                    background: "var(--worker-control-bg)",
                    color: "var(--worker-ink)",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {/* Worker note (optional) */}
            <div className="wk:flex wk:flex-col wk:gap-1">
              <label
                htmlFor="dialog-nota"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--worker-ink-secondary)" }}
              >
                Nota para el cliente{" "}
                <span style={{ color: "var(--worker-ink-muted)", fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                id="dialog-nota"
                type="text"
                value={nota}
                onChange={(e) => onNotaChange(e.target.value)}
                placeholder="Ej: Tu pedido está listo para recoger"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--worker-control-border)",
                  background: "var(--worker-control-bg)",
                  color: "var(--worker-ink)",
                  outline: "none",
                }}
              />
            </div>

            {/* Mutation error */}
            {saveError && (
              <p
                role="alert"
                style={{ fontSize: 13, color: "var(--worker-error-fg)", margin: 0 }}
              >
                {saveError}
              </p>
            )}
          </div>
        </WorkerDialogBody>

        <WorkerDialogFooter>
          <WorkerDialogCancel>Cancelar</WorkerDialogCancel>
          <WorkerDialogAction
            onClick={onConfirm}
            disabled={confirmDisabled}
            destructive={isDestructive}
          >
            {isSaving ? "Guardando…" : "Confirmar cambio"}
          </WorkerDialogAction>
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkerOrdersPage() {
  // ── Local UI state ──
  const [filtroEstado, setFiltroEstado]   = useState("");
  const [selectedId, setSelectedId]       = useState<number | null>(null);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [nuevoEstado, setNuevoEstado]     = useState("");
  const [razon, setRazon]                 = useState("");
  const [nota, setNota]                   = useState("");

  // ── Server state ──
  const {
    data: pedidos = [],
    isLoading,
    isError,
    isFetching,
  } = useWorkerPedidos(filtroEstado || undefined);

  const {
    data: selected,
    isLoading: loadingDetail,
    isError: errorDetail,
  } = useWorkerPedidoDetalle(selectedId);

  const cambiarEstado = useCambiarEstadoPedido();

  const transicionesDisponibles = selected
    ? (TRANSICIONES_VALIDAS[selected.estado] ?? [])
    : [];

  // ── Handlers ──

  const handleSelectPedido = (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    // Reset dialog/form state when switching order.
    setDialogOpen(false);
    setNuevoEstado("");
    setRazon("");
    setNota("");
    cambiarEstado.reset();
  };

  const handleOpenDialog = () => {
    setNuevoEstado("");
    setRazon("");
    setNota("");
    cambiarEstado.reset();
    setDialogOpen(true);
  };

  const handleConfirmCambio = () => {
    if (!selected || !nuevoEstado) return;

    cambiarEstado.mutate(
      {
        id: selected.id,
        estado: nuevoEstado,
        extra: {
          nota_worker: nota.trim() || undefined,
          denegado_razon: razon.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setNuevoEstado("");
          setRazon("");
          setNota("");
        },
        // onError: dialog stays open with saveError visible.
      }
    );
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroEstado(e.target.value);
    setSelectedId(null);
    setDialogOpen(false);
  };

  const handlePrint = () => window.print();

  const saveError = cambiarEstado.isError
    ? (cambiarEstado.error instanceof Error
        ? cambiarEstado.error.message
        : "Error al cambiar estado")
    : null;

  // ── Render ──

  return (
    <div
      className="wk:flex wk:h-full worker-split-panel"
      style={{ minHeight: 0 }}
    >

      {/* ── Left panel: order list ─────────────────────────────────────────── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid var(--worker-border-soft)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: "1rem 0.75rem",
          gap: 8,
        }}
      >
        <div className="wk:flex wk:items-center wk:justify-between">
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--worker-ink)",
              margin: 0,
            }}
          >
            Pedidos
          </h1>
          {isFetching && !isLoading && (
            <span style={{ fontSize: 11, color: "var(--worker-ink-muted)" }}>
              Actualizando…
            </span>
          )}
        </div>

        {/* Status filter */}
        <select
          value={filtroEstado}
          onChange={handleFiltroChange}
          aria-label="Filtrar por estado"
          style={{
            width: "100%",
            padding: "7px 10px",
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid var(--worker-control-border)",
            background: "var(--worker-control-bg)",
            color: "var(--worker-ink)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* List loading */}
        {isLoading && (
          <p style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", padding: "8px 0" }}>
            Cargando…
          </p>
        )}

        {/* List error */}
        {isError && !isLoading && (
          <div
            className="wk:rounded-lg wk:p-3"
            role="alert"
            style={{
              background: "var(--worker-error-bg)",
              border: "1px solid var(--worker-error-border)",
              color: "var(--worker-error-fg)",
              fontSize: 12,
            }}
          >
            Error al cargar pedidos
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && pedidos.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", padding: "8px 0" }}>
            Sin pedidos
          </p>
        )}

        {/* Order list */}
        <div className="wk:flex wk:flex-col wk:gap-1.5">
          {pedidos.map((p) => {
            const isSelected = selectedId === p.id;
            const statusColor = getPedidoStatusColor(p.estado);
            const statusBg    = getPedidoStatusBg(p.estado);

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPedido(p.id)}
                className="wk:rounded-lg wk:p-3 wk:flex wk:flex-col wk:gap-1 wk:text-left wk:w-full wk:transition-colors"
                style={{
                  background: isSelected ? statusBg || "var(--worker-bench)" : "var(--worker-shelf)",
                  border: "1px solid var(--worker-border-soft)",
                  /* Fulfillment rail — selected item (#2) */
                  borderLeft: isSelected
                    ? `3px solid ${statusColor}`
                    : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--worker-ink)" }}>
                  {p.cliente.nombre}
                </span>
                {/* Status badge */}
                <span
                  className="wk:self-start wk:rounded-full wk:px-2 wk:py-0.5"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: statusBg || "var(--worker-bench)",
                    color: statusColor,
                    border: `1px solid ${statusColor}`,
                  }}
                >
                  {ESTADO_LABEL[p.estado] ?? p.estado}
                </span>
                <span style={{ fontSize: 11, color: "var(--worker-ink-tertiary)" }}>
                  {new Date(p.created_at).toLocaleString("es-MX")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: order detail ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem 2rem",
        }}
      >
        {/* Empty state */}
        {!selectedId && !loadingDetail && !errorDetail && (
          <div
            style={{
              color: "var(--worker-ink-muted)",
              marginTop: 80,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            Selecciona un pedido para ver el detalle
          </div>
        )}

        {/* Detail loading */}
        {loadingDetail && (
          <p style={{ fontSize: 13, color: "var(--worker-ink-tertiary)" }}>
            Cargando detalle…
          </p>
        )}

        {/* Detail error */}
        {errorDetail && !loadingDetail && (
          <div
            className="wk:rounded-xl wk:p-4"
            role="alert"
            style={{
              background: "var(--worker-error-bg)",
              border: "1px solid var(--worker-error-border)",
              color: "var(--worker-error-fg)",
              fontSize: 14,
            }}
          >
            <strong>Error al cargar el pedido</strong>
          </div>
        )}

        {selected && !loadingDetail && (
          <div
            className="wk:flex wk:flex-col wk:gap-5"
            style={{ maxWidth: 640 }}
          >

            {/* ── Customer info card ─────────────────────────────────────── */}
            <div
              className="wk:rounded-xl wk:p-4 wk:flex wk:justify-between wk:items-start"
              style={{
                background: "var(--worker-shelf)",
                border: "1px solid var(--worker-border-soft)",
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--worker-ink)", margin: 0 }}>
                  {selected.cliente.nombre}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--worker-ink-secondary)" }}>
                  {selected.cliente.correo}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--worker-ink-secondary)" }}>
                  {selected.cliente.telefono}
                </p>
              </div>
              <div className="wk:text-right">
                <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: 0 }}>
                  {new Date(selected.created_at).toLocaleString("es-MX")}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "var(--worker-ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${Number(selected.precio_total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* ── Status + change module ─────────────────────────────────── */}
            <div
              className="wk:rounded-xl wk:overflow-hidden"
              style={{
                background: "var(--worker-shelf)",
                border: "1px solid var(--worker-border-soft)",
                /* Fulfillment rail — status/change module (#3) */
                borderLeft: `3px solid ${getPedidoStatusColor(selected.estado)}`,
              }}
            >
              <div className="wk:p-4">
                <div className="wk:flex wk:items-center wk:gap-3 wk:mb-4">
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--worker-ink)" }}>Estado:</span>
                  <span
                    className="wk:rounded-full wk:px-3 wk:py-1"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: getPedidoStatusBg(selected.estado) || "var(--worker-bench)",
                      color: getPedidoStatusColor(selected.estado),
                      border: `1px solid ${getPedidoStatusColor(selected.estado)}`,
                    }}
                  >
                    {ESTADO_LABEL[selected.estado] ?? selected.estado}
                  </span>
                </div>

                {transicionesDisponibles.length > 0 && (
                  <button
                    onClick={handleOpenDialog}
                    className="wk:rounded-lg wk:px-4 wk:py-2"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--worker-rail)",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--worker-rail-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--worker-rail)";
                    }}
                  >
                    Cambiar estado…
                  </button>
                )}

                {/* Success feedback inline */}
                {cambiarEstado.isSuccess && (
                  <p style={{ marginTop: 12, fontSize: 12, color: "var(--worker-inventory-fg)" }}>
                    Estado actualizado correctamente.
                  </p>
                )}

                {/* Worker note */}
                {selected.nota_worker && (
                  <p style={{ marginTop: 12, fontSize: 12, color: "var(--worker-ink-secondary)" }}>
                    <strong>Nota worker:</strong> {selected.nota_worker}
                  </p>
                )}
                {selected.denegado_razon && (
                  <p style={{ marginTop: 4, fontSize: 12, color: "var(--worker-error-fg)" }}>
                    <strong>Razón:</strong> {selected.denegado_razon}
                  </p>
                )}
              </div>
            </div>

            {/* ── Order items ───────────────────────────────────────────── */}
            <div
              className="wk:rounded-xl wk:p-4"
              style={{
                background: "var(--worker-shelf)",
                border: "1px solid var(--worker-border-soft)",
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--worker-ink)",
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Artículos ({selected.items.length})
              </h2>

              {selected.items.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                  Sin artículos
                </p>
              ) : (
                <div className="wk:space-y-2">
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      className="wk:flex wk:items-center wk:gap-4 wk:rounded-lg wk:p-3"
                      style={{
                        border: "1px solid var(--worker-border-soft)",
                        background: "var(--worker-bench)",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 6,
                          overflow: "hidden",
                          background: "var(--worker-shelf)",
                          border: "1px solid var(--worker-border-soft)",
                          flexShrink: 0,
                        }}
                      >
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                            }}
                          >
                            📦
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="wk:flex-1 wk:min-w-0">
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--worker-ink)" }}>
                          {item.nombre}
                          {item.item ? ` — ${item.item}` : ""}
                        </p>
                        <div className="wk:flex wk:items-center wk:gap-1.5 wk:mt-1">
                          <span
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: "50%",
                              background: item.color_hex || "#ccc",
                              border: "1px solid var(--worker-border)",
                              flexShrink: 0,
                              display: "inline-block",
                            }}
                          />
                          <span style={{ fontSize: 11, color: "var(--worker-ink-tertiary)" }}>
                            {item.color}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--worker-ink-tertiary)" }}>
                          ${Number(item.precio_unitario).toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Qty + subtotal */}
                      <div className="wk:text-right wk:shrink-0">
                        <p style={{ margin: 0, fontSize: 11, color: "var(--worker-ink-tertiary)", marginBottom: 2 }}>
                          × {item.cantidad}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--worker-ink)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div
                className="wk:flex wk:justify-end wk:items-center wk:gap-3 wk:mt-4 wk:pt-3"
                style={{ borderTop: "1px solid var(--worker-border-soft)" }}
              >
                <span style={{ fontSize: 12, color: "var(--worker-ink-secondary)" }}>
                  Total del pedido:
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "var(--worker-ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${Number(selected.precio_total).toFixed(2)}
                </span>
              </div>

              {selected.nota_cliente && (
                <p
                  className="wk:rounded-lg wk:px-3 wk:py-2 wk:mt-3"
                  style={{
                    fontSize: 12,
                    color: "var(--worker-ink-secondary)",
                    background: "var(--worker-bench)",
                    border: "1px solid var(--worker-border-soft)",
                  }}
                >
                  <strong>Nota del cliente:</strong> {selected.nota_cliente}
                </p>
              )}

              {selected.aprobado_eta && (
                <p style={{ marginTop: 8, fontSize: 12, color: "var(--worker-ink-secondary)" }}>
                  <strong>Entrega estimada:</strong>{" "}
                  {new Date(selected.aprobado_eta).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Print */}
            <div className="wk:flex wk:justify-end">
              <button
                onClick={handlePrint}
                className="wk:rounded-lg wk:px-4 wk:py-2"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--worker-ink-secondary)",
                  background: "var(--worker-bench)",
                  border: "1px solid var(--worker-border)",
                  cursor: "pointer",
                }}
              >
                Imprimir
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ── Status change dialog ───────────────────────────────────────────── */}
      {selected && (
        <StatusChangeDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open && !cambiarEstado.isPending) {
              setDialogOpen(false);
              cambiarEstado.reset();
            }
          }}
          pedidoId={selected.id}
          currentEstado={selected.estado}
          nuevoEstado={nuevoEstado}
          nota={nota}
          razon={razon}
          onNuevoEstadoChange={setNuevoEstado}
          onNotaChange={setNota}
          onRazonChange={setRazon}
          transicionesDisponibles={transicionesDisponibles}
          onConfirm={handleConfirmCambio}
          isSaving={cambiarEstado.isPending}
          saveError={saveError}
        />
      )}

    </div>
  );
}
