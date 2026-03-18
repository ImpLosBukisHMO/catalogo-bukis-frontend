import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { FavoritoVariante } from "../../types/favoritos";
import { getFavoritos, removeFavorito } from "../../services/favoritos";
import { addItem } from "../../services/carrito";
import { getAccessToken } from "../../services/auth";

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
    if (!getAccessToken()) {
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
        className="container is-fluid"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1 className="title is-2" style={{ color: "#111" }}>
            Mis favoritos
          </h1>

          {loading && <p>Cargando favoritos...</p>}

          {error && (
            <div className="notification is-danger">
              <button className="delete" onClick={() => setError(null)} />
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
            </div>
          )}

          {!loading && !error && favoritos.length === 0 && (
            <div className="box">
              <p style={{ color: "#111" }}>No tienes favoritos aún.</p>
              <button
                className="button is-dark mt-3"
                onClick={() => navigate("/")}
              >
                Explorar productos
              </button>
            </div>
          )}

          {!loading && favoritos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {favoritos.map((fav) => {
                const v = fav.variante;
                const imgSrc =
                  v.imagen ?? "https://placehold.net/600x600.png";
                const isBusy = busy === fav.id;
                const itemMsg = msg[fav.id];

                return (
                  <div
                    key={fav.id}
                    className="box"
                    style={{
                      background: "rgba(0,0,0,0.90)",
                      borderRadius: 16,
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Thumbnail */}
                      <figure
                        style={{
                          width: 80,
                          height: 80,
                          background: "#fff",
                          borderRadius: 10,
                          overflow: "hidden",
                          flex: "0 0 80px",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/producto/${v.id}`)}
                      >
                        <img
                          src={imgSrc}
                          alt={v.nombre_producto}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://placehold.net/600x600.png";
                          }}
                        />
                      </figure>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="title is-5"
                          style={{ color: "#fff", marginBottom: "0.25rem" }}
                        >
                          {v.nombre_producto}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              background: v.color.hex,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.3)",
                              display: "inline-block",
                            }}
                          />
                          <span
                            className="tag"
                            style={{
                              background: "rgba(255,255,255,0.12)",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            {v.color.nombre}
                          </span>
                        </div>

                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15 }}>
                          {money(Number(v.precio))}
                        </p>

                        {itemMsg && (
                          <p
                            style={{
                              fontSize: 12,
                              marginTop: 4,
                              color: itemMsg.startsWith("Error")
                                ? "#ff6b6b"
                                : "#69db7c",
                            }}
                          >
                            {itemMsg}
                          </p>
                        )}
                      </div>

                      {/* Botones */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: "flex-end",
                        }}
                      >
                        <button
                          className="button is-warning"
                          disabled={isBusy}
                          onClick={() => handleAddToCart(fav)}
                        >
                          {isBusy ? "..." : "Agregar al carrito"}
                        </button>

                        <button
                          className="button is-danger is-outlined"
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
