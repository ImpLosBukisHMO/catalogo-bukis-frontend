/**
 * WorkerDashboardPage — Operations cockpit for staff.
 *
 * Data: React Query (useWorkerPedidos + useWorkerVariants).
 * Styling: wk: Tailwind utilities + worker CSS variable tokens (no Bulma).
 * Fulfillment rail signature: present in queue pressure section header
 * (left accent strip) and status summary dots.
 */

import { useMemo } from "react";
import { useWorkerPedidos } from "../../queries/workerOrders";
import { useWorkerVariants } from "../../queries/workerProducts";
import { ESTADO_LABEL } from "../../types/worker";
import {
  getPedidoStatusColor,
  getStockColor,
  getStockTone,
} from "../elements/workerTheme";

const STOCK_BAJO = 5;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="wk:space-y-6" aria-busy="true" aria-label="Cargando dashboard…">
      {/* KPI row */}
      <div className="wk:grid wk:grid-cols-3 wk:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="wk:rounded-xl wk:animate-pulse"
            style={{
              height: 96,
              background: "var(--worker-bench)",
              border: "1px solid var(--worker-border-soft)",
            }}
          />
        ))}
      </div>
      {/* Body */}
      <div className="wk:grid wk:grid-cols-3 wk:gap-4">
        <div
          className="wk:col-span-2 wk:rounded-xl wk:animate-pulse"
          style={{ height: 240, background: "var(--worker-bench)", border: "1px solid var(--worker-border-soft)" }}
        />
        <div
          className="wk:rounded-xl wk:animate-pulse"
          style={{ height: 240, background: "var(--worker-bench)", border: "1px solid var(--worker-border-soft)" }}
        />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function DashboardError({ message }: { message: string }) {
  return (
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
      <strong>Error al cargar el dashboard:</strong>{" "}
      <span style={{ color: "var(--worker-ink-secondary)" }}>{message}</span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  /** CSS variable expression or hex — the rail accent color for this KPI. */
  accentVar: string;
}

function KpiCard({ label, value, accentVar }: KpiCardProps) {
  return (
    <div
      className="wk:rounded-xl wk:p-4 wk:flex wk:flex-col wk:gap-1"
      style={{
        background: "var(--worker-shelf)",
        border: "1px solid var(--worker-border-soft)",
        borderTop: `3px solid ${accentVar}`,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--worker-ink-tertiary)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: accentVar,
          margin: 0,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkerDashboardPage() {
  const {
    data: pedidos = [],
    isLoading: loadingPedidos,
    isError: errorPedidos,
    error: pedidosError,
  } = useWorkerPedidos();

  const {
    data: variants = [],
    isLoading: loadingVariants,
    isError: errorVariants,
    error: variantsError,
  } = useWorkerVariants();

  const isLoading = loadingPedidos || loadingVariants;
  const isError   = errorPedidos || errorVariants;
  const errorMsg  = isError
    ? (pedidosError instanceof Error ? pedidosError.message : null) ??
      (variantsError instanceof Error ? variantsError.message : "Error al cargar el dashboard")
    : null;

  // Derived summaries — memoized to avoid recalculation on unrelated renders.
  const pendientes = useMemo(
    () => pedidos.filter((p) => p.estado === "PENDING"),
    [pedidos]
  );
  const enProceso = useMemo(
    () => pedidos.filter((p) => ["APPROVED", "READY"].includes(p.estado)),
    [pedidos]
  );
  const sinStock = useMemo(
    () => variants.filter((v) => v.stock <= STOCK_BAJO),
    [variants]
  );
  const recientes = useMemo(
    () => [...pendientes].slice(0, 5),
    [pendientes]
  );

  if (isLoading) return <DashboardSkeleton />;
  if (isError && !pedidos.length && !variants.length)
    return <DashboardError message={errorMsg ?? "Error desconocido"} />;

  return (
    <div className="wk:space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="wk:flex wk:items-start wk:justify-between">
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--worker-ink)",
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--worker-ink-tertiary)", margin: "4px 0 0" }}>
            Resumen general de pedidos e inventario
          </p>
        </div>
        {/* Background refresh indicator */}
        {(loadingPedidos || loadingVariants) && (
          <span style={{ fontSize: 11, color: "var(--worker-ink-muted)", marginTop: 4 }}>
            Actualizando…
          </span>
        )}
      </div>

      {/* Soft error banner (partial — data may still be stale-visible) */}
      {isError && (pedidos.length > 0 || variants.length > 0) && (
        <div
          className="wk:rounded-lg wk:px-4 wk:py-2"
          style={{
            background: "var(--worker-dispatch-bg)",
            border: "1px solid var(--worker-dispatch-border)",
            color: "var(--worker-dispatch-fg)",
            fontSize: 13,
          }}
        >
          No se pudo actualizar algunos datos. Mostrando información anterior.
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="wk:grid wk:grid-cols-1 wk:sm:grid-cols-3 wk:gap-4">
        <KpiCard
          label="Pedidos pendientes"
          value={pendientes.length}
          accentVar="var(--worker-error-fg)"
        />
        <KpiCard
          label="En proceso"
          value={enProceso.length}
          accentVar="var(--worker-dispatch-fg)"
        />
        <KpiCard
          label={`Stock bajo (≤ ${STOCK_BAJO})`}
          value={sinStock.length}
          accentVar="var(--worker-dispatch-fg)"
        />
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="wk:grid wk:grid-cols-1 wk:lg:grid-cols-3 wk:gap-4">

        {/* ── Queue pressure — recent pending orders ───────────────────────── */}
        <div
          className="wk:lg:col-span-2 wk:rounded-xl wk:overflow-hidden"
          style={{
            background: "var(--worker-shelf)",
            border: "1px solid var(--worker-border-soft)",
          }}
        >
          {/* Fulfillment rail header accent */}
          <div
            className="wk:flex wk:items-center wk:gap-3 wk:px-4 wk:py-3"
            style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
          >
            {/* Rail strip — fulfillment rail signature placement #4 */}
            <div
              style={{
                width: 3,
                height: 20,
                borderRadius: 2,
                background: "var(--worker-error-fg)",
                flexShrink: 0,
              }}
            />
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--worker-ink)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Últimos pendientes
            </h2>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--worker-error-fg)",
                background: "var(--worker-error-bg)",
                border: "1px solid var(--worker-error-border)",
                borderRadius: 20,
                padding: "1px 10px",
              }}
            >
              {pendientes.length}
            </span>
          </div>

          <div className="wk:p-4">
            {recientes.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--worker-ink-muted)", textAlign: "center", padding: "24px 0" }}>
                Sin pedidos pendientes
              </p>
            ) : (
              <div className="wk:space-y-2">
                {recientes.map((p) => (
                  <div
                    key={p.id}
                    className="wk:flex wk:items-center wk:justify-between wk:rounded-lg wk:px-3 wk:py-2"
                    style={{
                      background: "var(--worker-bench)",
                      border: "1px solid var(--worker-border-soft)",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500, margin: 0, fontSize: 13, color: "var(--worker-ink)" }}>
                        {p.cliente.nombre}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: "2px 0 0" }}>
                        {p.items_count} {p.items_count === 1 ? "artículo" : "artículos"}
                      </p>
                    </div>
                    <div className="wk:text-right">
                      <p
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          fontSize: 13,
                          color: "var(--worker-ink)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ${Number(p.precio_total).toFixed(2)}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: "2px 0 0" }}>
                        {new Date(p.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stock attention ───────────────────────────────────────────────── */}
        <div
          className="wk:rounded-xl wk:overflow-hidden"
          style={{
            background: "var(--worker-shelf)",
            border: "1px solid var(--worker-border-soft)",
          }}
        >
          <div
            className="wk:flex wk:items-center wk:gap-3 wk:px-4 wk:py-3"
            style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
          >
            <div
              style={{
                width: 3,
                height: 20,
                borderRadius: 2,
                background: "var(--worker-dispatch-fg)",
                flexShrink: 0,
              }}
            />
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--worker-ink)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Alertas de stock
            </h2>
          </div>

          <div className="wk:p-4">
            {sinStock.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--worker-inventory-fg)", textAlign: "center", padding: "24px 0" }}>
                Todo en orden
              </p>
            ) : (
              <div className="wk:space-y-2">
                {sinStock.slice(0, 8).map((v) => {
                  const tone = getStockTone(v.stock);
                  const fgColor = getStockColor(v.stock);
                  const bgColor =
                    tone === "out"
                      ? "var(--worker-error-bg)"
                      : "var(--worker-dispatch-bg)";
                  const borderColor =
                    tone === "out"
                      ? "var(--worker-error-border)"
                      : "var(--worker-dispatch-border)";

                  return (
                    <div
                      key={v.variant_id}
                      className="wk:flex wk:items-center wk:gap-2 wk:rounded-lg wk:px-3 wk:py-2"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      {/* Color swatch */}
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: v.color.hex,
                          border: "1px solid var(--worker-border)",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <div className="wk:flex-1 wk:min-w-0">
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--worker-ink)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.producto.nombre}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: "1px 0 0" }}>
                          {v.color.nombre}
                        </p>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: fgColor,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v.stock}
                      </span>
                    </div>
                  );
                })}
                {sinStock.length > 8 && (
                  <p style={{ fontSize: 12, color: "var(--worker-ink-secondary)", textAlign: "center", marginTop: 4 }}>
                    +{sinStock.length - 8} más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status summary ─────────────────────────────────────────────────── */}
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
          Resumen por estado
        </h2>
        <div className="wk:flex wk:flex-wrap wk:gap-2">
          {Object.entries(ESTADO_LABEL).map(([key, label]) => {
            const count   = pedidos.filter((p) => p.estado === key).length;
            const dotColor = getPedidoStatusColor(key);
            return (
              <span
                key={key}
                className="wk:flex wk:items-center wk:gap-1.5 wk:rounded-full wk:px-3 wk:py-1"
                style={{
                  fontSize: 12,
                  background: "var(--worker-bench)",
                  border: "1px solid var(--worker-border-soft)",
                  color: "var(--worker-ink-secondary)",
                }}
              >
                {/* Status rail dot — fulfillment rail signature #5 (status summary) */}
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                {label}:{" "}
                <strong style={{ color: "var(--worker-ink)", fontVariantNumeric: "tabular-nums" }}>
                  {count}
                </strong>
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}
