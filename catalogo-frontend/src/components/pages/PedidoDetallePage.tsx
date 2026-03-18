import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { PedidoDetalle, PedidoItem } from "../../types/pedido";
import { getMiPedidoDetalle } from "../../services/pedidos";


const ESTADO_COLOR: Record<string, string> = {
  PENDING: "#f5a623",
  APPROVED: "#4a90d9",
  DENIED: "#e63946",
  READY: "#7bc67e",
  SHIPPED: "#9b59b6",
  COMPLETED: "#27ae60",
  CANCELED: "#888",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  DENIED: "Denegado",
  READY: "Listo",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

function money(v: string | number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(v));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ItemRow({ item }: { item: PedidoItem }) {
  const imgSrc = item.imagen_principal_snapshot || "https://placehold.net/600x600.png";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <figure
        style={{
          width: 64,
          height: 64,
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          flex: "0 0 64px",
        }}
      >
        <img
          src={imgSrc}
          alt={item.producto_nombre_snapshot}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://placehold.net/600x600.png";
          }}
        />
      </figure>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#fff", fontWeight: 600, marginBottom: 2 }}>
          {item.producto_nombre_snapshot}
          {item.producto_item_snapshot ? ` — ${item.producto_item_snapshot}` : ""}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: item.color_hex_snapshot || "#ccc",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
            {item.color_nombre_snapshot}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", minWidth: 160 }}>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 2 }}>
          {money(item.precio_unitario_snapshot)} × {item.cantidad}
        </p>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
          {money(item.subtotal_linea_snapshot)}
        </p>
      </div>
    </div>
  );
}

export default function PedidoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const data = await getMiPedidoDetalle(Number(id));
        setPedido(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando pedido");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <>
      <title>Detalle de pedido | Importaciones Los Bukis</title>
      <NavBar />

      <div
        className="container is-fluid"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <button
            className="button is-light mb-4"
            onClick={() => navigate("/pedidos")}
          >
            ← Mis pedidos
          </button>

          {loading && <p>Cargando pedido...</p>}

          {error && (
            <div className="notification is-danger">
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
            </div>
          )}

          {!loading && !error && pedido && (
            <>
              {/* Encabezado */}
              <div
                className="box"
                style={{
                  background: "rgba(0,0,0,0.88)",
                  borderRadius: 14,
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p className="title is-3" style={{ color: "#fff", marginBottom: 6 }}>
                      Pedido #{pedido.id}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                      {formatDate(pedido.created_at)}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        background: ESTADO_COLOR[pedido.estado] ?? "#888",
                        color: "#fff",
                        padding: "4px 14px",
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 600,
                        display: "inline-block",
                        marginBottom: 8,
                      }}
                    >
                      {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
                    </span>

                    <p className="title is-4" style={{ color: "#fff", margin: 0 }}>
                      {money(pedido.precio_total)}
                    </p>
                  </div>
                </div>

                {/* Mensajes adicionales */}
                {pedido.denegado_razon && (
                  <div
                    className="notification is-danger is-light mt-4"
                    style={{ marginBottom: 0 }}
                  >
                    <strong>Razón de denegación:</strong> {pedido.denegado_razon}
                  </div>
                )}
                {pedido.nota_worker && (
                  <div
                    className="notification is-info is-light mt-4"
                    style={{ marginBottom: 0 }}
                  >
                    <strong>Nota del equipo:</strong> {pedido.nota_worker}
                  </div>
                )}
                {pedido.aprobado_eta && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 8 }}>
                    Fecha estimada de entrega:{" "}
                    {new Date(pedido.aprobado_eta).toLocaleDateString("es-MX")}
                  </p>
                )}
              </div>

              {/* Productos */}
              <div
                className="box"
                style={{ background: "rgba(0,0,0,0.88)", borderRadius: 14 }}
              >
                <p className="title is-5" style={{ color: "#fff", marginBottom: "0.75rem" }}>
                  Productos
                </p>

                {pedido.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "1rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="title is-5" style={{ color: "#fff", margin: 0 }}>
                    Total: {money(pedido.precio_total)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
