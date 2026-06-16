import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { FavoritoVariante } from "../../types/favoritos";
import { getFavoritos, removeFavorito } from "../../services/favoritos";
import { addItem } from "../../services/carrito";


function money(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function FavoritosPage() {
  const navigate = useNavigate();

  const [favoritos, setFavoritos] = useState<FavoritoVariante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/iniciar-sesion");
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getFavoritos();
      setFavoritos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando favoritos");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(favId: number) {
    try {
      setBusy(favId);
      await removeFavorito(favId);
      setFavoritos((prev) => prev.filter((f) => f.id !== favId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al quitar favorito");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddToCart(fav: FavoritoVariante) {
    if (!localStorage.getItem("access") && !localStorage.getItem("token")) {
      navigate("/iniciar-sesion");
      return;
    }

    const favId = fav.id;
    try {
      setBusy(favId);
      setMsg((prev) => ({ ...prev, [favId]: "" }));
      await addItem(fav.variante.id, 1);
      setMsg((prev) => ({ ...prev, [favId]: "Agregado al carrito." }));
    } catch (e) {
      setMsg((prev) => ({
        ...prev,
        [favId]: e instanceof Error ? e.message : "Error al agregar",
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <title>Favoritos | Importaciones Los Bukis</title>
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
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1 className="mb-6 text-3xl font-bold text-bukis-ink">
            Mis favoritos
          </h1>

          {loading && <p className="text-neutral-600">Cargando favoritos...</p>}

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

          {!loading && !error && favoritos.length === 0 && (
            <div className="rounded-2xl border border-bukis-border bg-white p-6 shadow-bukis-soft">
              <p className="text-bukis-ink">No tienes favoritos aún.</p>
              <button
                className="mt-3 inline-flex rounded-xl bg-neutral-900 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800"
                onClick={() => navigate("/")}
              >
                Explorar productos
              </button>
            </div>
          )}

          {!loading && favoritos.length > 0 && (
            <div className="flex flex-col gap-6">
              {favoritos.map((fav) => {
                const v = fav.variante;
                const imgSrc =
                  v.imagen ?? "https://placehold.net/600x600.png";
                const isBusy = busy === fav.id;
                const itemMsg = msg[fav.id];

                return (
                  <div
                    key={fav.id}
                    className="rounded-2xl bg-[rgba(0,0,0,0.90)] p-5"
                  >
                    <div className="flex flex-wrap items-center gap-5">
                      {/* Thumbnail */}
                      <figure
                        className="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-white"
                        onClick={() => navigate(`/producto/${v.id}`)}
                      >
                        <img
                          src={imgSrc}
                          alt={v.nombre_producto}
                          className="block h-full w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://placehold.net/600x600.png";
                          }}
                        />
                      </figure>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-white">
                          {v.nombre_producto}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full"
                            style={{
                              background: v.color.hex,
                              border: "1px solid rgba(255,255,255,0.3)",
                            }}
                          />
                          <span className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-0.5 text-xs font-medium text-white">
                            {v.color.nombre}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-white/80">
                          {money(Number(v.precio))}
                        </p>

                        {itemMsg && (
                          <p
                            className={`mt-1 text-xs ${
                              itemMsg.startsWith("Error")
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {itemMsg}
                          </p>
                        )}
                      </div>

                      {/* Botones */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => handleAddToCart(fav)}
                        >
                          {isBusy ? "..." : "Agregar al carrito"}
                        </button>

                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => handleRemove(fav.id)}
                        >
                          Quitar de favoritos
                        </button>
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
