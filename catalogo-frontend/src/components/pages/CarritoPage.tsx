import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { CarritoResponse } from "../../types/carrito";
import { getCarritoActual, updateItemCantidad, deleteItem } from "../../services/carrito";
import { apiFetch } from "../../services/apiFetch";

const API_URL = "http://127.0.0.1:8000/api";

function money(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getProductId(item: any): number | null {
  return (
    item?.producto?.id ??
    item?.producto_id ??
    item?.productoId ??
    item?.variante?.producto?.id ??
    item?.variante?.producto_id ??
    null
  );
}

function getProductName(item: any): string {
  return (
    item?.producto?.nombre ??
    item?.producto_nombre ??
    item?.nombre_producto ??
    item?.nombre ??
    "Producto"
  );
}

function getProductDesc(item: any): string {
  return (
    item?.producto?.descripcion ??
    item?.descripcion_producto ??
    item?.descripcion ??
    ""
  );
}

function getColorName(item: any): string {
  return (
    item?.color?.nombre ??
    item?.variante?.color?.nombre ??
    item?.variante?.color_nombre ??
    item?.color_nombre ??
    ""
  );
}

function getColorHex(item: any): string | null {
  return (
    item?.color?.hex ??
    item?.variante?.color?.hex ??
    item?.variante?.color_hex ??
    item?.color_hex ??
    null
  );
}

function getUnitPrice(item: any): number {
  // Prioridad
  // 1) precio_unitario del item
  // 2) precio de la variante
  // 3) precio del producto
  return toNumber(
    item?.precio_unitario ??
      item?.variante?.precio ??
      item?.producto?.precio ??
      item?.precio,
    0
  );
}

function getQty(item: any): number {
  return toNumber(item?.cantidad, 1);
}

function getImageSrc(item: any): string {
  // Intentamos varias rutas comunes para no pelear con el backend
  return (
    item?.imagen ??
    item?.imagenUrl ??
    item?.producto?.imagen ??
    item?.producto_imagen ??
    item?.variante?.imagen ??
    item?.variante?.producto?.imagen ??
    item?.variante?.producto_imagen ??
    "https://placehold.net/600x600.png"
  );
}

export default function CarritoPage() {
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<CarritoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | "checkout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // cantidad editable por item
  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});

  const items = (carrito as any)?.items ?? [];

  const total = useMemo(() => {
    // si backend trae subtotal total, lo usamos; si no, lo calculamos
    const backendSubtotal = (carrito as any)?.subtotal;
    if (backendSubtotal != null) return toNumber(backendSubtotal, 0);

    return items.reduce((acc: number, it: any) => {
      const unit = getUnitPrice(it);
      const qty = getQty(it);
      return acc + unit * qty;
    }, 0);
  }, [carrito, items]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCarritoActual();
      setCarrito(data);

      // inicializa drafts con cantidades actuales
      const next: Record<number, string> = {};
      (data as any)?.items?.forEach((it: any) => {
        if (it?.id != null) next[Number(it.id)] = String(getQty(it));
      });
      setQtyDraft(next);

      // Debug útil: aquí sí existe la variable
      console.log("carrito item example", (data as any)?.items?.[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando carrito");
      setCarrito(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onApplyQty(item: any) {
    const itemId = Number(item?.id);
    const raw = (qtyDraft[itemId] ?? "").trim();
    const n = Number(raw);

    if (!Number.isInteger(n) || n < 1) {
      setError("Cantidad inválida. Usa un entero mayor o igual a 1.");
      return;
    }

    try {
      setBusy(itemId);
      setError(null);
      await updateItemCantidad(itemId, n);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error actualizando cantidad");
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(item: any) {
    const itemId = Number(item?.id);
    try {
      setBusy(itemId);
      setError(null);
      await deleteItem(itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error eliminando item");
    } finally {
      setBusy(null);
    }
  }

  async function onCheckout() {
    try {
      setBusy("checkout");
      setError(null);

      const res = await apiFetch(`${API_URL}/carrito/checkout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota_cliente: "" }),
      });

      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;

      if (!res.ok) {
        throw new Error(JSON.stringify(data ?? { detail: "Checkout falló" }));
      }

      // Puedes redirigir a un page de confirmación si luego lo haces
      // Por ahora, recargamos carrito para que quede vacío
      await load();

      // Si quieres: navega a /pedidos o /perfil más adelante
      // navigate("/perfil");
      console.log("checkout ok", data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en checkout");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <title>Carrito | Importaciones Los Bukis</title>
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
            Carrito
          </h1>

          {loading && <p>Cargando carrito...</p>}
          {error && (
            <div className="notification is-danger">
              <button className="delete" onClick={() => setError(null)} />
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
            </div>
          )}

          {!loading && !error && (!items || items.length === 0) && (
            <div className="box">
              <p style={{ color: "#111" }}>Tu carrito está vacío.</p>
              <button
                className="button is-dark mt-3"
                onClick={() => navigate("/")}
              >
                Volver a inicio
              </button>
            </div>
          )}

          {!loading && items && items.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {items.map((item: any) => {
                  const itemId = Number(item?.id);
                  const productId = getProductId(item);

                  const nombre = getProductName(item);
                  const descripcion = getProductDesc(item);
                  const colorName = getColorName(item);
                  const colorHex = getColorHex(item);

                  const unit = getUnitPrice(item);
                  const qty = getQty(item);
                  const subtotal = unit * qty;

                  const imgSrc = getImageSrc(item);

                  return (
                    <div
                      key={itemId}
                      className="box"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (productId != null) navigate(`/producto/${productId}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (productId != null) navigate(`/producto/${productId}`);
                        }
                      }}
                      style={{
                        background: "rgba(0,0,0,0.90)",
                        borderRadius: 16,
                        padding: "1.25rem",
                        cursor: productId != null ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.25rem",
                        }}
                      >
                        {/* Imagen cuadrada */}
                        <figure
                          style={{
                            width: 160,
                            height: 160,
                            background: "#fff",
                            borderRadius: 12,
                            overflow: "hidden",
                            flex: "0 0 160px",
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={nombre}
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
                          <h2
                            className="title is-3"
                            style={{
                              color: "#fff",
                              marginBottom: "0.25rem",
                              lineHeight: 1.1,
                            }}
                          >
                            {nombre}
                          </h2>

                          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
                            {descripcion ? (
                              <p style={{ marginBottom: 8, maxWidth: 720 }}>
                                {descripcion}
                              </p>
                            ) : null}

                            {(colorName || colorHex) && (
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span>{colorName}</span>
                                {colorHex && (
                                  <span
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: 999,
                                      background: colorHex,
                                      border: "1px solid rgba(255,255,255,0.25)",
                                      display: "inline-block",
                                    }}
                                  />
                                )}
                              </div>
                            )}

                            <p style={{ marginTop: 8 }}>
                              Precio unitario: {money(unit)}
                            </p>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div style={{ minWidth: 190, textAlign: "right" }}>
                          <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                            Subtotal
                          </p>
                          <p
                            className="title is-4"
                            style={{ color: "#fff", margin: 0 }}
                          >
                            {money(subtotal)}
                          </p>
                        </div>

                        {/* Controles */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            minWidth: 230,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 10,
                          }}
                        >
                          <div style={{ width: "100%" }}>
                            <label
                              className="label"
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 13,
                                textAlign: "right",
                                marginBottom: 6,
                              }}
                            >
                              Cantidad
                            </label>

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                              <input
                                className="input"
                                type="number"
                                min={1}
                                step={1}
                                value={qtyDraft[itemId] ?? String(qty)}
                                onChange={(e) =>
                                  setQtyDraft((p) => ({ ...p, [itemId]: e.target.value }))
                                }
                                style={{ width: 90 }}
                                disabled={busy === itemId}
                              />

                              <button
                                className="button is-light"
                                onClick={() => onApplyQty(item)}
                                disabled={busy === itemId}
                              >
                                OK
                              </button>

                              <button
                                className="button is-danger"
                                onClick={() => onRemove(item)}
                                disabled={busy === itemId}
                              >
                                Quitar
                              </button>
                            </div>

                            <p
                              style={{
                                color: "rgba(255,255,255,0.45)",
                                fontSize: 12,
                                textAlign: "right",
                                marginTop: 6,
                              }}
                            >
                              Cambia y aplica.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total + checkout */}
              <div
                className="box mt-5"
                style={{
                  background: "rgba(0,0,0,0.90)",
                  borderRadius: 16,
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Total del pedido
                  </p>
                  <p className="title is-3" style={{ color: "#fff", margin: 0 }}>
                    {money(total)}
                  </p>
                </div>

                <button
                  className={`button is-warning is-large`}
                  onClick={onCheckout}
                  disabled={busy === "checkout" || items.length === 0}
                >
                  {busy === "checkout" ? "Procesando..." : "Checkout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
