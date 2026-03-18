import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { PedidoResumen } from "../../types/pedido";
import { getMisPedidos } from "../../services/pedidos";
import { getAccessToken } from "../../services/auth";

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
  });
}

export default function MisPedidosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await getMisPedidos();
        setPedidos(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <title>Mis Pedidos | Importaciones Los Bukis</title>
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 className="title is-2" style={{ color: "#111" }}>
            Mis pedidos
          </h1>

          {loading && <p>Cargando pedidos...</p>}

          {error && (
            <div className="notification is-danger">
              <button className="delete" onClick={() => setError(null)} />
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
            </div>
          )}

          {!loading && !error && pedidos.length === 0 && (
            <div className="box">
              <p style={{ color: "#111" }}>No tienes pedidos aún.</p>
              <button
                className="button is-dark mt-3"
                onClick={() => navigate("/")}
              >
                Explorar productos
              </button>
            </div>
          )}

          {!loading && pedidos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pedidos.map((p) => {
                const estadoColor = ESTADO_COLOR[p.estado] ?? "#888";
                const estadoLabel = ESTADO_LABEL[p.estado] ?? p.estado;

                return (
                  <div
                    key={p.id}
                    className="box"
                    style={{
                      background: "rgba(0,0,0,0.88)",
                      borderRadius: 14,
                      padding: "1.25rem",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/pedidos/${p.id}`)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <p
                          className="title is-5"
                          style={{ color: "#fff", marginBottom: 4 }}
                        >
                          Pedido #{p.id}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                          {formatDate(p.created_at)} · {p.items_count}{" "}
                          {p.items_count === 1 ? "producto" : "productos"}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span
                          style={{
                            background: estadoColor,
                            color: "#fff",
                            padding: "3px 12px",
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {estadoLabel}
                        </span>
                        <span
                          className="title is-5"
                          style={{ color: "#fff", margin: 0 }}
                        >
                          {money(p.precio_total)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>
                          ›
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
