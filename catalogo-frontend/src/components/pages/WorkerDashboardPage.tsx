import { useEffect, useState } from "react";
import { getWorkerPedidos, getWorkerVariants } from "../../services/worker";
import type { WorkerPedido, WorkerVariant } from "../../types/worker";
import { ESTADO_LABEL } from "../../types/worker";
import {
  surface,
  ink,
  semantic,
  statusColor,
} from "../elements/workerTheme";

const STOCK_BAJO = 5;

export default function WorkerDashboardPage() {
  const [pedidos, setPedidos] = useState<WorkerPedido[]>([]);
  const [variants, setVariants] = useState<WorkerVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getWorkerPedidos(), getWorkerVariants()])
      .then(([p, v]) => {
        if (cancelled) return;
        setPedidos(p);
        setVariants(v);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar el dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const pendientes = pedidos.filter((p) => p.estado === "PENDING");
  const enProceso = pedidos.filter((p) => ["APPROVED", "READY"].includes(p.estado));
  const sinStock = variants.filter((v) => v.stock <= STOCK_BAJO);
  const recientes = [...pendientes].slice(0, 5);

  if (loading)
    return <p className="has-text-grey">Cargando dashboard…</p>;

  if (error)
    return (
      <div className="notification is-danger is-light">
        {error}
      </div>
    );

  return (
    <>
      {/* ── Page header ── */}
      <div className="level mb-5">
        <div className="level-left">
          <div>
            <h1 className="title is-4">Dashboard</h1>
            <p className="subtitle is-6">Resumen general de pedidos e inventario</p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="columns is-multiline mb-5">
        <div className="column is-4">
          <KpiCard
            label="Pedidos pendientes"
            value={pendientes.length}
            accentColor={semantic.danger.fg}
          />
        </div>
        <div className="column is-4">
          <KpiCard
            label="En proceso"
            value={enProceso.length}
            accentColor={semantic.warning.fg}
          />
        </div>
        <div className="column is-4">
          <KpiCard
            label={`Stock bajo (≤ ${STOCK_BAJO})`}
            value={sinStock.length}
            accentColor={semantic.warning.fg}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="columns mb-5">

        {/* Pedidos recientes pendientes */}
        <div className="column is-8">
          <div className="box">
            <h2 className="title is-6 mb-4">Últimos pedidos pendientes</h2>
            {recientes.length === 0 ? (
              <p className="has-text-grey">Sin pedidos pendientes</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recientes.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: surface.inset,
                      border: `1px solid ${surface.border}`,
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500, margin: 0, fontSize: 14, color: ink.primary }}>
                        {p.cliente.nombre}
                      </p>
                      <p style={{ fontSize: 12, color: ink.tertiary, margin: 0 }}>
                        {p.items_count} {p.items_count === 1 ? "artículo" : "artículos"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: 14, color: ink.primary }}>
                        ${Number(p.precio_total).toFixed(2)}
                      </p>
                      <p style={{ fontSize: 12, color: ink.tertiary, margin: 0 }}>
                        {new Date(p.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas stock bajo */}
        <div className="column is-4">
          <div className="box">
            <h2 className="title is-6 mb-4">Alertas de stock</h2>
            {sinStock.length === 0 ? (
              <p style={{ fontSize: 13, color: semantic.success.fg }}>Todo en orden</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sinStock.slice(0, 8).map((v) => {
                  const isEmpty = v.stock === 0;
                  const sem = isEmpty ? semantic.danger : semantic.warning;
                  return (
                    <div
                      key={v.variant_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
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
                        <p style={{ fontSize: 12, color: ink.tertiary, margin: 0 }}>{v.color.nombre}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: sem.fg }}>
                        {v.stock}
                      </span>
                    </div>
                  );
                })}
                {sinStock.length > 8 && (
                  <p style={{ fontSize: 13, color: ink.secondary, textAlign: "center" }}>
                    +{sinStock.length - 8} más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resumen por estado ── */}
      <div className="box">
        <h2 className="title is-6 mb-4">Resumen por estado</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(ESTADO_LABEL).map(([key, label]) => {
            const count = pedidos.filter((p) => p.estado === key).length;
            const color = statusColor[key];
            return (
              <span
                key={key}
                className="tag"
                style={{ backgroundColor: surface.inset, border: `1px solid ${surface.border}`, color: ink.secondary, gap: 4 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                {label}:{" "}
                <strong style={{ color: ink.primary }}>{count}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </>
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
    <div className="box" style={{ borderTop: `3px solid ${accentColor}` }}>
      <p className="heading">{label}</p>
      <p className="title is-2" style={{ color: accentColor }}>
        {value}
      </p>
    </div>
  );
}
