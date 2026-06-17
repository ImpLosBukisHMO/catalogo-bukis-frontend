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
        className="w-full"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <button
            className="mb-4 inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            onClick={() => navigate("/pedidos")}
          >
            ← Mis pedidos
          </button>

          {loading && <p className="text-neutral-600">Cargando pedido...</p>}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}

          {!loading && !error && pedido && (
            <>
              {/* Encabezado */}
              <div className="mb-6 rounded-2xl bg-[rgba(0,0,0,0.88)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      Pedido #{pedido.id}
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      {formatDate(pedido.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className="mb-2 inline-block rounded-full px-3.5 py-1 text-sm font-semibold text-white"
                      style={{
                        background: ESTADO_COLOR[pedido.estado] ?? "#888",
                      }}
                    >
                      {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
                    </span>

                    <p className="text-xl font-bold text-white">
                      {money(pedido.precio_total)}
                    </p>
                  </div>
                </div>

                {/* Mensajes adicionales */}
                {pedido.denegado_razon && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                    <strong>Razón de denegación:</strong> {pedido.denegado_razon}
                  </div>
                )}
                {pedido.nota_worker && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
                    <strong>Nota del equipo:</strong> {pedido.nota_worker}
                  </div>
                )}
                {pedido.aprobado_eta && (
                  <p className="mt-2 text-xs text-white/60">
                    Fecha estimada de entrega:{" "}
                    {new Date(pedido.aprobado_eta).toLocaleDateString("es-MX")}
                  </p>
                )}
              </div>

              {/* Productos */}
              <div className="rounded-2xl bg-[rgba(0,0,0,0.88)] p-5">
                <p className="mb-3 text-lg font-bold text-white">
                  Productos
                </p>

                {pedido.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}

                <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
                  <p className="text-lg font-bold text-white">
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
