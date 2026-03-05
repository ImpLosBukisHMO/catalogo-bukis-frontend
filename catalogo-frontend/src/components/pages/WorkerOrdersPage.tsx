import { useEffect, useState } from "react";
import {
  getWorkerPedidos,
  getWorkerPedidoDetalle,
  cambiarEstadoPedido,
} from "../../services/worker";
import type { WorkerPedido, WorkerPedidoDetalle } from "../../types/worker";
import { ESTADO_LABEL, TRANSICIONES_VALIDAS } from "../../types/worker";
import {
  brand,
  card,
  surface,
  ink,
  semantic,
  statusColor,
  typo,
  btn,
  control,
  sp,
  r,
} from "../elements/workerTheme";

export default function WorkerOrdersPage() {
  const [pedidos, setPedidos]             = useState<WorkerPedido[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState<WorkerPedidoDetalle | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError]     = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado]   = useState("");

  const [nuevoEstado, setNuevoEstado] = useState("");
  const [razon, setRazon]             = useState("");
  const [nota, setNota]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  function cargarPedidos(estado?: string) {
    setLoading(true);
    getWorkerPedidos(estado || undefined)
      .then(setPedidos)
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargarPedidos(); }, []);

  const handleSelectPedido = async (id: number) => {
    setSelected(null);
    setSaveError(null);
    setDetailError(null);
    setNuevoEstado("");
    setRazon("");
    setNota("");
    setLoadingDetail(true);
    try {
      const detalle = await getWorkerPedidoDetalle(id);
      setSelected(detalle);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Error cargando detalle");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!selected || !nuevoEstado) return;
    setSaving(true);
    setSaveError(null);
    try {
      await cambiarEstadoPedido(selected.id, nuevoEstado, {
        nota_worker: nota || undefined,
        denegado_razon: razon || undefined,
      });
      const [lista, detalle] = await Promise.all([
        getWorkerPedidos(filtroEstado || undefined),
        getWorkerPedidoDetalle(selected.id),
      ]);
      setPedidos(lista);
      setSelected(detalle);
      setNuevoEstado("");
      setRazon("");
      setNota("");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setSaving(false);
    }
  };

  const transicionesDisponibles = selected
    ? (TRANSICIONES_VALIDAS[selected.estado] ?? [])
    : [];

  const handlePrint = () => window.print();

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", gap: 0 }}>

      {/* ── Left panel: order list ── */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          overflowY: "auto",
          borderRight: `1px solid ${surface.border}`,
          padding: `${sp.lg}px ${sp.md}px`,
          display: "flex",
          flexDirection: "column",
          gap: sp.sm,
          backgroundColor: surface.canvas,
        }}
      >
        <h1 style={{ ...typo.pageTitle, fontSize: 20, paddingLeft: sp.xs, marginBottom: sp.sm }}>
          Pedidos
        </h1>

        {/* Status filter */}
        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            cargarPedidos(e.target.value || undefined);
          }}
          style={{ ...control, marginBottom: sp.xs }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {loading && <p style={typo.small}>Cargando…</p>}
        {!loading && pedidos.length === 0 && (
          <p style={{ ...typo.small, paddingLeft: sp.xs }}>Sin pedidos</p>
        )}

        {pedidos.map((p) => {
          const isSelected = selected?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPedido(p.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: `${sp.md}px`,
                borderRadius: r.lg,
                border: `1px solid ${isSelected ? "rgba(221,0,0,0.25)" : surface.border}`,
                borderLeft: isSelected ? `3px solid ${brand}` : `1px solid ${surface.border}`,
                paddingLeft: isSelected ? sp.md - 2 : sp.md,
                background: isSelected ? "#fff5f5" : surface.card,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: ink.primary }}>
                {p.cliente.nombre}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: statusColor[p.estado] ?? ink.secondary }}>
                {ESTADO_LABEL[p.estado] ?? p.estado}
              </span>
              <span style={typo.micro}>
                {new Date(p.created_at).toLocaleString("es-MX")}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Right panel: order detail ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: `${sp["2xl"]}px ${sp["3xl"]}px`,
          backgroundColor: surface.canvas,
        }}
      >
        {!selected && !loadingDetail && !detailError && (
          <div style={{ color: ink.tertiary, marginTop: 80, textAlign: "center", fontSize: 14 }}>
            Selecciona un pedido para ver el detalle
          </div>
        )}

        {loadingDetail && <p style={typo.small}>Cargando detalle…</p>}

        {detailError && !loadingDetail && (
          <div
            style={{
              background: semantic.danger.bg,
              border: `1px solid ${semantic.danger.border}`,
              borderRadius: r.lg,
              padding: `${sp.lg}px ${sp.xl}px`,
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            <strong>Error al cargar el pedido:</strong>
            <pre style={{ marginTop: sp.sm, whiteSpace: "pre-wrap", fontSize: 12 }}>
              {detailError}
            </pre>
          </div>
        )}

        {selected && !loadingDetail && (
          <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: sp.xl }}>

            {/* Customer info */}
            <div
              style={{
                ...card,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2 style={{ ...typo.pageTitle, fontSize: 18 }}>{selected.cliente.nombre}</h2>
                <p style={{ margin: "4px 0 0", ...typo.small }}>{selected.cliente.correo}</p>
                <p style={{ margin: "2px 0 0", ...typo.small }}>{selected.cliente.telefono}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ ...typo.micro, margin: 0 }}>
                  {new Date(selected.created_at).toLocaleString("es-MX")}
                </p>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 18, color: ink.primary }}>
                  ${Number(selected.precio_total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status + state change */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: sp.md, marginBottom: sp.lg }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: ink.primary }}>Estado:</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: statusColor[selected.estado] ?? ink.secondary,
                    padding: `2px ${sp.md}px`,
                    borderRadius: 20,
                    background: surface.inset,
                  }}
                >
                  {ESTADO_LABEL[selected.estado] ?? selected.estado}
                </span>
              </div>

              {transicionesDisponibles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    style={control}
                  >
                    <option value="">Cambiar estado…</option>
                    {transicionesDisponibles.map((e) => (
                      <option key={e} value={e}>{ESTADO_LABEL[e] ?? e}</option>
                    ))}
                  </select>

                  {nuevoEstado === "DENIED" && (
                    <textarea
                      placeholder="Razón del rechazo (obligatorio)"
                      value={razon}
                      onChange={(e) => setRazon(e.target.value)}
                      rows={2}
                      style={{ ...control, resize: "vertical" }}
                    />
                  )}

                  <input
                    type="text"
                    placeholder="Nota para el cliente (opcional)"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    style={control}
                  />

                  {saveError && (
                    <p style={{ color: semantic.danger.fg, fontSize: 13, margin: 0 }}>
                      {saveError}
                    </p>
                  )}

                  <div>
                    <button
                      onClick={handleCambiarEstado}
                      disabled={saving || !nuevoEstado || (nuevoEstado === "DENIED" && !razon)}
                      style={
                        saving || !nuevoEstado || (nuevoEstado === "DENIED" && !razon)
                          ? btn.disabled
                          : btn.primary
                      }
                    >
                      {saving ? "Guardando…" : "Confirmar cambio"}
                    </button>
                  </div>
                </div>
              )}

              {selected.nota_worker && (
                <p style={{ marginTop: sp.md, ...typo.small }}>
                  <strong>Nota worker:</strong> {selected.nota_worker}
                </p>
              )}
              {selected.denegado_razon && (
                <p style={{ marginTop: sp.xs, ...typo.small, color: semantic.danger.fg }}>
                  <strong>Razón:</strong> {selected.denegado_razon}
                </p>
              )}
            </div>

            {/* Order items */}
            <div style={card}>
              <h2 style={{ ...typo.sectionTitle, marginBottom: sp.lg }}>
                Artículos ({selected.items.length})
              </h2>
              {selected.items.length === 0 ? (
                <p style={typo.small}>Sin artículos</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: sp.lg,
                        padding: `${sp.md}px`,
                        borderRadius: r.md,
                        border: `1px solid ${surface.border}`,
                        background: surface.inset,
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: r.sm,
                          overflow: "hidden",
                          background: surface.card,
                          border: `1px solid ${surface.border}`,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: ink.primary }}>
                          {item.nombre}
                          {item.item ? ` — ${item.item}` : ""}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: "50%",
                              background: item.color_hex || "#ccc",
                              border: `1px solid ${surface.borderMid}`,
                              flexShrink: 0,
                            }}
                          />
                          <span style={typo.micro}>{item.color}</span>
                        </div>
                        <p style={{ margin: "4px 0 0", ...typo.micro }}>
                          ${Number(item.precio_unitario).toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Qty + subtotal */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, ...typo.micro, marginBottom: 2 }}>× {item.cantidad}</p>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: ink.primary }}>
                          ${Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: sp.lg,
                  paddingTop: sp.md,
                  borderTop: `1px solid ${surface.border}`,
                  gap: sp.md,
                  alignItems: "center",
                }}
              >
                <span style={{ ...typo.small }}>Total del pedido:</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: ink.primary }}>
                  ${Number(selected.precio_total).toFixed(2)}
                </span>
              </div>

              {selected.nota_cliente && (
                <p
                  style={{
                    marginTop: sp.md,
                    ...typo.small,
                    padding: `${sp.sm}px ${sp.md}px`,
                    background: surface.inset,
                    borderRadius: r.sm,
                    border: `1px solid ${surface.border}`,
                  }}
                >
                  <strong>Nota del cliente:</strong> {selected.nota_cliente}
                </p>
              )}

              {selected.aprobado_eta && (
                <p style={{ marginTop: sp.sm, ...typo.small }}>
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
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handlePrint} style={btn.secondary}>
                Imprimir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
