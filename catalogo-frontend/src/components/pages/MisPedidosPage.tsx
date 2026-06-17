import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { PedidoResumen } from "../../types/pedido";
import { getMisPedidos } from "../../services/pedidos";


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
    if (!localStorage.getItem("access")) {
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
        className="w-full"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 className="mb-6 text-3xl font-bold text-bukis-ink">
            Mis pedidos
          </h1>

          {loading && <p className="text-neutral-600">Cargando pedidos...</p>}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <pre className="flex-1 whitespace-pre-wrap text-sm">{error}</pre>
              <button
                className="mt-0.5 text-red-400 hover:text-red-600"
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          )}

          {!loading && !error && pedidos.length === 0 && (
            <div className="rounded-2xl border border-bukis-border bg-white p-6 shadow-bukis-soft">
              <p className="text-bukis-ink">No tienes pedidos aún.</p>
              <button
                className="mt-3 inline-flex rounded-xl bg-neutral-900 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800"
                onClick={() => navigate("/")}
              >
                Explorar productos
              </button>
            </div>
          )}

          {!loading && pedidos.length > 0 && (
            <div className="flex flex-col gap-4">
              {pedidos.map((p) => {
                const estadoColor = ESTADO_COLOR[p.estado] ?? "#888";
                const estadoLabel = ESTADO_LABEL[p.estado] ?? p.estado;

                return (
                  <div
                    key={p.id}
                    className="cursor-pointer rounded-2xl bg-[rgba(0,0,0,0.88)] p-5"
                    onClick={() => navigate(`/pedidos/${p.id}`)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-white">
                          Pedido #{p.id}
                        </p>
                        <p className="text-xs text-white/60">
                          {formatDate(p.created_at)} · {p.items_count}{" "}
                          {p.items_count === 1 ? "producto" : "productos"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                          style={{ background: estadoColor }}
                        >
                          {estadoLabel}
                        </span>
                        <span className="text-lg font-bold text-white">
                          {money(p.precio_total)}
                        </span>
                        <span className="text-lg text-white/40">›</span>
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
