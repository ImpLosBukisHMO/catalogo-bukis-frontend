import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { CarritoResponse } from "../../types/carrito";
import { getCarritoActual, updateItemCantidad, deleteItem, checkoutCart } from "../../services/carrito";
import { IMAGE_PLACEHOLDER_URL, resolveImageUrlOrPlaceholder } from "../../utils/images";

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
  const src =
    item.imagen ??
    item.imagenUrl ??
    nested(item, "producto", "imagen") ??
    item.producto_imagen ??
    nested(item, "variante", "imagen") ??
    nested(item, "variante", "producto", "imagen") ??
    nested(item, "variante", "producto_imagen");
  return resolveImageUrlOrPlaceholder(src != null ? String(src) : null);
}

export default function CarritoPage() {
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<CarritoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | "checkout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});

  const items: CartItem[] = (carrito?.items ?? []) as CartItem[];

  const total = useMemo(() => {
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

      const next: Record<number, string> = {};
      (data?.items ?? []).forEach((it) => {
        if (it?.id != null) next[Number(it.id)] = String(getQty(it as CartItem));
      });
      setQtyDraft(next);

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

      <div className="px-4 py-8 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="mb-6 text-4xl font-bold text-bukis-ink">
            Carrito
          </h1>

          {loading && <p className="text-neutral-600">Cargando carrito...</p>}
          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <pre className="m-0 flex-1 whitespace-pre-wrap text-sm text-red-800">{error}</pre>
                <button
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-100"
                  onClick={() => setError(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (!items || items.length === 0) && (
            <div className="rounded-2xl border border-bukis-border bg-white p-6 shadow-bukis-soft">
              <p className="text-bukis-ink">Tu carrito está vacío.</p>
              <button
                className="mt-3 inline-flex rounded-xl bg-neutral-900 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800"
                onClick={() => navigate("/")}
              >
                Volver a inicio
              </button>
            </div>
          )}

          {!loading && items && items.length > 0 && (
            <>
              <div className="flex flex-col gap-6">
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
                      className="cursor-pointer rounded-2xl bg-neutral-950 p-5 shadow-bukis-soft"
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
                    >
                      <div className="flex items-center gap-5">
                        <figure className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-white">
                          <img
                            src={imgSrc}
                            alt={nombre}
                            className="block h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = IMAGE_PLACEHOLDER_URL;
                            }}
                          />
                        </figure>

                        <div className="min-w-0 flex-1">
                          <h2 className="mb-1 text-3xl font-bold leading-tight text-white">
                            {nombre}
                          </h2>
                          <div className="text-sm text-white/75">
                            {descripcion ? (
                              <p className="mb-2 max-w-[720px]">{descripcion}</p>
                            ) : null}

                            {(colorName || colorHex) && (
                              <div className="flex items-center gap-2.5">
                                <span>{colorName}</span>
                                {colorHex && (
                                  <span
                                    className="inline-block h-3.5 w-3.5 rounded-full"
                                    style={{
                                      background: colorHex,
                                      border: "1px solid rgba(255,255,255,0.25)",
                                    }}
                                  />
                                )}
                              </div>
                            )}

                            <p className="mt-2">
                              Precio unitario: {money(unit)}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-[190px] text-right">
                          <p className="mb-1.5 text-white/55">
                            Subtotal
                          </p>
                          <p className="m-0 text-2xl font-bold text-white">
                            {money(subtotal)}
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex min-w-[230px] flex-col items-end gap-2.5"
                        >
                          <div className="w-full">
                            <label className="mb-1.5 block text-right text-xs text-white/60">
                              Cantidad
                            </label>

                            <div className="flex justify-end gap-2.5">
                              <input
                                className="w-24 rounded-xl border border-neutral-700 bg-white px-3 py-2 text-sm text-bukis-ink outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:bg-neutral-200"
                                type="number"
                                min={1}
                                step={1}
                                value={qtyDraft[itemId] ?? String(qty)}
                                onChange={(e) =>
                                  setQtyDraft((p) => ({ ...p, [itemId]: e.target.value }))
                                }
                                disabled={busy === itemId}
                              />

                              <button
                                className="inline-flex items-center justify-center rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => onApplyQty(item)}
                                disabled={busy === itemId}
                              >
                                OK
                              </button>

                              <button
                                className="inline-flex items-center justify-center rounded-xl bg-bukis-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-bukis-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => onRemove(item)}
                                disabled={busy === itemId}
                              >
                                Quitar
                              </button>
                            </div>

                            <p className="mt-1.5 text-right text-xs text-white/45">
                              Cambia y aplica.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-neutral-950 p-5 shadow-bukis-soft">
                <div>
                  <p className="mb-1.5 text-white/70">
                    Total del pedido
                  </p>
                  <p className="m-0 text-3xl font-bold text-white">
                    {money(total)}
                  </p>
                </div>

                <button
                  className="rounded-xl bg-amber-400 px-8 py-3 text-lg font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
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
