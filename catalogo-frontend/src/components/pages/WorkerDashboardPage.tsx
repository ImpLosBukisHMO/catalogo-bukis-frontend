import { useEffect, useState } from "react";
import { getWorkerPedidos, getWorkerVariants } from "../../services/worker";
import type { WorkerPedido, WorkerVariant } from "../../types/worker";
import { ESTADO_LABEL } from "../../types/worker";
import {
  card,
  surface,
  ink,
  semantic,
  statusColor,
  typo,
  sp,
  r,
  pageHeaderRow,
} from "../elements/workerTheme";

const STOCK_BAJO = 5;

export default function WorkerDashboardPage() {
  const [pedidos, setPedidos] = useState<WorkerPedido[]>([]);
  const [variants, setVariants] = useState<WorkerVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkerPedidos(), getWorkerVariants()])
      .then(([p, v]) => {
        setPedidos(p);
        setVariants(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendientes = pedidos.filter((p) => p.estado === "PENDING");
  const enProceso = pedidos.filter((p) => ["APPROVED", "READY"].includes(p.estado));
  const sinStock = variants.filter((v) => v.stock <= STOCK_BAJO);
  const recientes = [...pendientes].slice(0, 5);

  if (loading)
    return <p style={typo.small}>Cargando dashboard…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: sp["3xl"] }}>

      {/* ── Page header ── */}
      <div style={pageHeaderRow}>
        <div>
          <h1 style={typo.pageTitle}>Dashboard</h1>
          <p style={typo.subtitle}>Resumen general de pedidos e inventario</p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: sp.lg }}>
        <KpiCard
          label="Pedidos pendientes"
          value={pendientes.length}
          accentColor={semantic.danger.fg}
        />
        <KpiCard
          label="En proceso"
          value={enProceso.length}
          accentColor={semantic.warning.fg}
        />
        <KpiCard
          label={`Stock bajo (≤ ${STOCK_BAJO})`}
          value={sinStock.length}
          accentColor={semantic.warning.fg}
        />
      </div>

      {/* ── Body ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: sp.lg }}>

        {/* Pedidos recientes pendientes */}
        <div style={card}>
          <h2 style={{ ...typo.sectionTitle, marginBottom: sp.lg }}>
            Últimos pedidos pendientes
          </h2>
          {recientes.length === 0 ? (
            <p style={typo.small}>Sin pedidos pendientes</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
              {recientes.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${sp.sm}px ${sp.md}px`,
                    borderRadius: r.md,
                    background: surface.inset,
                    border: `1px solid ${surface.border}`,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500, margin: 0, fontSize: 14, color: ink.primary }}>
                      {p.cliente.nombre}
                    </p>
                    <p style={{ ...typo.micro, margin: 0 }}>
                      {p.items_count} {p.items_count === 1 ? "artículo" : "artículos"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 14, color: ink.primary }}>
                      ${Number(p.precio_total).toFixed(2)}
                    </p>
                    <p style={{ ...typo.micro, margin: 0 }}>
                      {new Date(p.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas stock bajo */}
        <div style={card}>
          <h2 style={{ ...typo.sectionTitle, marginBottom: sp.lg }}>
            Alertas de stock
          </h2>
          {sinStock.length === 0 ? (
            <p style={{ ...typo.small, color: semantic.success.fg }}>Todo en orden</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
              {sinStock.slice(0, 8).map((v) => {
                const isEmpty = v.stock === 0;
                const sem = isEmpty ? semantic.danger : semantic.warning;
                return (
                  <div
                    key={v.variant_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: sp.sm,
                      padding: `${sp.sm}px ${sp.md}px`,
                      borderRadius: r.md,
                      background: sem.bg,
                      border: `1px solid ${sem.border}`,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: v.color.hex,
                        border: `1px solid ${surface.borderMid}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 500,
                          color: ink.primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.producto.nombre}
                      </p>
                      <p style={{ ...typo.micro, margin: 0 }}>{v.color.nombre}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: sem.fg }}>
                      {v.stock}
                    </span>
                  </div>
                );
              })}
              {sinStock.length > 8 && (
                <p style={{ ...typo.small, textAlign: "center" }}>
                  +{sinStock.length - 8} más
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Resumen por estado ── */}
      <div style={card}>
        <h2 style={{ ...typo.sectionTitle, marginBottom: sp.lg }}>
          Resumen por estado
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: sp.sm }}>
          {Object.entries(ESTADO_LABEL).map(([key, label]) => {
            const count = pedidos.filter((p) => p.estado === key).length;
            const color = statusColor[key];
            return (
              <div
                key={key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: sp.xs,
                  padding: `${sp.xs}px ${sp.md}px`,
                  borderRadius: 20,
                  background: surface.inset,
                  border: `1px solid ${surface.border}`,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: ink.secondary }}>{label}:</span>
                <span style={{ fontWeight: 600, color: ink.primary }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function KpiCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: number;
  accentColor: string;
}) {
  return (
    <div
      style={{
        ...card,
        borderTop: `3px solid ${accentColor}`,
        paddingTop: sp.xl - 3, // compensate for extra border
      }}
    >
      <p style={{ ...typo.label, margin: 0 }}>{label}</p>
      <h2
        style={{
          fontSize: 36,
          fontWeight: 700,
          margin: `${sp.sm}px 0 0`,
          color: accentColor,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </h2>
    </div>
  );
}
