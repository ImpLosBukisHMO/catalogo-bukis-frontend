import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { CarritoResponse } from "../../types/carrito";
import { getCarritoActual, updateItemCantidad, deleteItem, checkoutCart } from "../../services/carrito";

function money(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

type CartItem = Record<string, unknown>;

function toNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nested(obj: unknown, ...keys: string[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

function getProductId(item: CartItem): number | null {
  const id =
    nested(item, "producto", "id") ??
    item.producto_id ??
    item.productoId ??
    nested(item, "variante", "producto", "id") ??
    nested(item, "variante", "producto_id") ??
    null;
  return id != null ? Number(id) : null;
}

function getProductName(item: CartItem): string {
  return String(
    nested(item, "producto", "nombre") ??
    item.producto_nombre ??
    item.nombre_producto ??
    item.nombre ??
    "Producto"
  );
}

function getProductDesc(item: CartItem): string {
  return String(
    nested(item, "producto", "descripcion") ??
    item.descripcion_producto ??
    item.descripcion ??
    ""
  );
}

function getColorName(item: CartItem): string {
  return String(
    nested(item, "color", "nombre") ??
    nested(item, "variante", "color", "nombre") ??
    nested(item, "variante", "color_nombre") ??
    item.color_nombre ??
    ""
  );
}

function getColorHex(item: CartItem): string | null {
  const hex =
    nested(item, "color", "hex") ??
    nested(item, "variante", "color", "hex") ??
    nested(item, "variante", "color_hex") ??
    item.color_hex ??
    null;
  return hex != null ? String(hex) : null;
}

function getUnitPrice(item: CartItem): number {
  // Priority: precio_unitario → variante.precio → producto.precio → precio
  return toNumber(
    item.precio_unitario ??
      nested(item, "variante", "precio") ??
      nested(item, "producto", "precio") ??
      item.precio,
    0
  );
}

function getQty(item: CartItem): number {
  return toNumber(item.cantidad, 1);
}

function getImageSrc(item: CartItem): string {
  // Try common paths to avoid fighting the backend shape
  const src =
    item.imagen ??
    item.imagenUrl ??
    nested(item, "producto", "imagen") ??
    item.producto_imagen ??
    nested(item, "variante", "imagen") ??
    nested(item, "variante", "producto", "imagen") ??
    nested(item, "variante", "producto_imagen") ??
    "https://placehold.net/600x600.png";
  return String(src);
}

export default function CarritoPage() {
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<CarritoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | "checkout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // cantidad editable por item
  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});

  const items: CartItem[] = (carrito?.items ?? []) as CartItem[];

  const total = useMemo(() => {
    // si backend trae subtotal total, lo usamos; si no, lo calculamos
    if (carrito?.subtotal != null) return toNumber(carrito.subtotal, 0);

    return items.reduce((acc: number, it: CartItem) => {
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
      (data?.items ?? []).forEach((it) => {
        if (it?.id != null) next[Number(it.id)] = String(getQty(it as CartItem));
      });
      setQtyDraft(next);

      // Debug útil: aquí sí existe la variable
      console.log("carrito item example", data?.items?.[0]);
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

  async function onApplyQty(item: CartItem) {
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

  async function onRemove(item: CartItem) {
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

      const data = await checkoutCart();

      await load();

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
                {items.map((item: CartItem) => {
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
