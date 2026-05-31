import { useEffect, useState } from "react";
import {
  getWorkerPedidos,
  getWorkerPedidoDetalle,
  cambiarEstadoPedido,
} from "../../services/worker";
import type { WorkerPedido, WorkerPedidoDetalle } from "../../types/worker";
import { ESTADO_LABEL, TRANSICIONES_VALIDAS } from "../../types/worker";
import {
  surface,
  ink,
  semantic,
  statusColor,
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
  const [listError, setListError]     = useState<string | null>(null);

  function cargarPedidos(estado?: string) {
    setLoading(true);
    setListError(null);
    getWorkerPedidos(estado || undefined)
      .then(setPedidos)
      .catch((err: unknown) =>
        setListError(err instanceof Error ? err.message : "Error al cargar pedidos")
      )
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
    <div className="columns is-gapless worker-split-panel">

      {/* ── Left panel: order list ── */}
      <div className="column is-narrow worker-split-left" style={{ borderRight: `1px solid ${surface.border}`, padding: "1rem 0.75rem" }}>
        <h1 className="title is-5" style={{ paddingLeft: "0.25rem", marginBottom: "0.5rem" }}>
          Pedidos
        </h1>

        {/* Status filter */}
        <div className="field">
          <div className="control">
            <div className="select is-fullwidth" style={{ marginBottom: "0.25rem" }}>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  cargarPedidos(e.target.value || undefined);
                }}
              >
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <p style={{ fontSize: 13, color: ink.secondary }}>Cargando…</p>}
        {listError && !loading && (
          <div className="notification is-danger is-light" style={{ fontSize: 13, marginBottom: "0.5rem" }}>
            {listError}
          </div>
        )}
        {!loading && !listError && pedidos.length === 0 && (
          <p style={{ fontSize: 13, color: ink.secondary, paddingLeft: "0.25rem" }}>Sin pedidos</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pedidos.map((p) => {
            const isSelected = selected?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPedido(p.id)}
                className="box"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "0.75rem",
                  borderLeft: isSelected ? `3px solid ${semantic.danger.fg}` : "3px solid transparent",
                  background: isSelected ? semantic.danger.bg : undefined,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  marginBottom: 0,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14, color: ink.primary }}>
                  {p.cliente.nombre}
                </span>
                <span
                  className="tag"
                  style={{
                    backgroundColor: statusColor[p.estado] ?? ink.secondary,
                    color: "#fff",
                    alignSelf: "flex-start",
                  }}
                >
                  {ESTADO_LABEL[p.estado] ?? p.estado}
                </span>
                <span style={{ fontSize: 12, color: ink.tertiary }}>
                  {new Date(p.created_at).toLocaleString("es-MX")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: order detail ── */}
      <div className="column" style={{ overflowY: "auto", padding: "1.5rem 2rem" }}>
        {!selected && !loadingDetail && !detailError && (
          <div style={{ color: ink.tertiary, marginTop: 80, textAlign: "center", fontSize: 14 }}>
            Selecciona un pedido para ver el detalle
          </div>
        )}

        {loadingDetail && <p style={{ fontSize: 13, color: ink.secondary }}>Cargando detalle…</p>}

        {detailError && !loadingDetail && (
          <div className="notification is-danger is-light">
            <strong>Error al cargar el pedido:</strong>
            <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 12 }}>
              {detailError}
            </pre>
          </div>
        )}

        {selected && !loadingDetail && (
          <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Customer info */}
            <div className="box" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 className="title is-5" style={{ marginBottom: 4 }}>{selected.cliente.nombre}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: ink.secondary }}>{selected.cliente.correo}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: ink.secondary }}>{selected.cliente.telefono}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: ink.tertiary, margin: 0 }}>
                  {new Date(selected.created_at).toLocaleString("es-MX")}
                </p>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 18, color: ink.primary }}>
                  ${Number(selected.precio_total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status + state change */}
            <div className="box">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: ink.primary }}>Estado:</span>
                <span
                  className="tag is-medium"
                  style={{ backgroundColor: statusColor[selected.estado] ?? ink.secondary, color: "#fff" }}
                >
                  {ESTADO_LABEL[selected.estado] ?? selected.estado}
                </span>
              </div>

              {transicionesDisponibles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="field">
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select
                          value={nuevoEstado}
                          onChange={(e) => setNuevoEstado(e.target.value)}
                        >
                          <option value="">Cambiar estado…</option>
                          {transicionesDisponibles.map((e) => (
                            <option key={e} value={e}>{ESTADO_LABEL[e] ?? e}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {nuevoEstado === "DENIED" && (
                    <div className="field">
                      <div className="control">
                        <textarea
                          className="textarea"
                          placeholder="Razón del rechazo (obligatorio)"
                          value={razon}
                          onChange={(e) => setRazon(e.target.value)}
                          rows={2}
                          style={{ resize: "vertical" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="Nota para el cliente (opcional)"
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                      />
                    </div>
                  </div>

                  {saveError && (
                    <p style={{ color: semantic.danger.fg, fontSize: 13, margin: 0 }}>
                      {saveError}
                    </p>
                  )}

                  <div>
                    <button
                      className="button is-dark"
                      onClick={handleCambiarEstado}
                      disabled={saving || !nuevoEstado || (nuevoEstado === "DENIED" && !razon)}
                    >
                      {saving ? "Guardando…" : "Confirmar cambio"}
                    </button>
                  </div>
                </div>
              )}

              {selected.nota_worker && (
                <p style={{ marginTop: 12, fontSize: 13, color: ink.secondary }}>
                  <strong>Nota worker:</strong> {selected.nota_worker}
                </p>
              )}
              {selected.denegado_razon && (
                <p style={{ marginTop: 4, fontSize: 13, color: semantic.danger.fg }}>
                  <strong>Razón:</strong> {selected.denegado_razon}
                </p>
              )}
            </div>

            {/* Order items */}
            <div className="box">
              <h2 className="title is-6" style={{ marginBottom: 16 }}>
                Artículos ({selected.items.length})
              </h2>
              {selected.items.length === 0 ? (
                <p style={{ fontSize: 13, color: ink.secondary }}>Sin artículos</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px",
                        borderRadius: 8,
                        border: `1px solid ${surface.border}`,
                        background: surface.inset,
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 6,
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
                          <span style={{ fontSize: 12, color: ink.tertiary }}>{item.color}</span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: ink.tertiary }}>
                          ${Number(item.precio_unitario).toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Qty + subtotal */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, color: ink.tertiary, marginBottom: 2 }}>× {item.cantidad}</p>
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
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: `1px solid ${surface.border}`,
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: ink.secondary }}>Total del pedido:</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: ink.primary }}>
                  ${Number(selected.precio_total).toFixed(2)}
                </span>
              </div>

              {selected.nota_cliente && (
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: ink.secondary,
                    padding: "8px 12px",
                    background: surface.inset,
                    borderRadius: 6,
                    border: `1px solid ${surface.border}`,
                  }}
                >
                  <strong>Nota del cliente:</strong> {selected.nota_cliente}
                </p>
              )}

              {selected.aprobado_eta && (
                <p style={{ marginTop: 8, fontSize: 13, color: ink.secondary }}>
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
              <button className="button is-outlined" onClick={handlePrint}>
                Imprimir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
