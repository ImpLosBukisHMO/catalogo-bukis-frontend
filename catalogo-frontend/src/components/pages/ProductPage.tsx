import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import ProductCard from "../elements/ProductCard";
import { addItem } from "../../services/carrito";

import {
  getProductById,
  getProductImages,
  getProducts,
  type ProductImage,
} from "../../services/product";

import type { ProductDetail, Variant } from "../../types/product";
import type { Product, ProductCardVM } from "../../types/product";

function pickDefaultVariantId(variantes: Variant[]): number | null {
  if (!variantes?.length) return null;
  const firstDisponible = variantes.find((v) => v.disponible);
  return (firstDisponible ?? variantes[0]).id;
}

function parseQty(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);

  const [qtyRaw, setQtyRaw] = useState("1");
  const [qtyError, setQtyError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Más productos (mismo componente que Home)
  const [moreProducts, setMoreProducts] = useState<ProductCardVM[]>([]);
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (!product || selectedVariantId == null) return null;
    return product.variantes.find((v) => v.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return images.find((i) => i.id === activeImageId) ?? images[0];
  }, [images, activeImageId]);

  const stock = selectedVariant?.stock ?? 0;
  const isDisponible = Boolean(selectedVariant?.disponible);
  const qty = useMemo(() => parseQty(qtyRaw), [qtyRaw]);
  const displayedPrice = selectedVariant?.precio ?? product?.precio ?? "0";

  const validation = useMemo(() => {
    if (!selectedVariant) return { ok: false, msg: "Selecciona una variante." };
    if (!isDisponible || stock <= 0) return { ok: false, msg: "Sin stock." };
    if (qty == null) return { ok: false, msg: "Ingresa una cantidad." };
    if (qty < 1) return { ok: false, msg: "La cantidad mínima es 1." };
    if (qty > stock) return { ok: false, msg: "No hay suficiente disponibilidad para esa cantidad." };
    return { ok: true, msg: null as string | null };
  }, [qty, selectedVariant, isDisponible, stock]);

  const canBuy = validation.ok;

  // Cargar producto
  useEffect(() => {
    (async () => {
      try {
        if (!id) {
          setError("No se recibió el ID del producto.");
          return;
        }

        setLoading(true);
        setError(null);
        setNotFound(false);

        const data = await getProductById(id);
        setProduct(data);

        const defVariantId = pickDefaultVariantId(data.variantes);
        setSelectedVariantId(defVariantId);
      } catch (e: unknown) {
        const status =
          e != null &&
          typeof e === "object" &&
          "response" in e &&
          e.response != null &&
          typeof e.response === "object" &&
          "status" in e.response
            ? (e.response as { status: number }).status
            : null;

        if (status === 404) {
          setNotFound(true);
        } else {
          setError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Reset cantidad al cambiar variante
  useEffect(() => {
    setQtyRaw("1");
    setQtyError(null);
  }, [selectedVariantId]);

  // Cargar imágenes por variante (fallback por producto)
  useEffect(() => {
    (async () => {
      if (!product) return;

      try {
        setImgLoading(true);

        let imgs: ProductImage[] = [];

        if (selectedVariantId != null) {
          imgs = await getProductImages({ variante: selectedVariantId });
        }

        if (!imgs.length) {
          imgs = await getProductImages({ producto: product.id });
        }

        setImages(imgs);

        const principal = imgs.find((i) => i.es_principal) ?? imgs[0] ?? null;
        setActiveImageId(principal?.id ?? null);
      } catch {
        setImages([]);
        setActiveImageId(null);
      } finally {
        setImgLoading(false);
      }
    })();
  }, [product, selectedVariantId]);

  // Cargar “Más productos” usando el mismo ProductCard del Home
  useEffect(() => {
    (async () => {
      try {
        setMoreLoading(true);
        setMoreError(null);

        const data: Product[] = await getProducts();

        const mapped: ProductCardVM[] = data
          .filter((p) => String(p.id) !== String(id)) // evita repetir el mismo producto
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio),
            imagenUrl: p.imagen ?? null,
            disponible: true,
          }))
          .slice(0, 8);

        setMoreProducts(mapped);
      } catch (e) {
        setMoreError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setMoreLoading(false);
      }
    })();
  }, [id]);

  return (
    <>
      <title>Producto | Importaciones Los Bukis</title>
      <NavBar />

      <main className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-12">
          {loading && <p className="text-neutral-600">Cargando producto...</p>}
          {error && <p className="text-bukis-red-700">{error}</p>}

          {!loading && notFound && (
            <div className="py-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-bukis-ink">
                Producto no encontrado
              </h2>
              <p className="mb-6 text-neutral-600">
                El producto que buscas no está disponible o fue dado de baja.
              </p>
              <a href="/" className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800">
                Volver al inicio
              </a>
            </div>
          )}

          {!loading && !error && !notFound && product && (
            <>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_minmax(280px,2fr)] lg:items-start">
                {/* Imagen */}
                <div>
                  <div className="rounded-2xl border border-bukis-border bg-white p-4 shadow-bukis-soft">
                    {imgLoading && <p className="mb-3 text-neutral-600">Cargando imágenes...</p>}

                    <figure
                      className="aspect-square overflow-hidden rounded-xl bg-white"
                    >
                      <img
                        src={
                          activeImage?.imagen ??
                          product.imagen ??
                          "https://placehold.net/600x600.png"
                        }
                        alt={product.nombre}
                        className="h-full w-full object-contain"
                      />
                    </figure>

                    {images.length > 1 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {images.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            className={`rounded-lg px-3 py-1 text-sm font-medium transition ${img.id === activeImageId ? "bg-neutral-900 text-white" : "border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"}`}
                            onClick={() => setActiveImageId(img.id)}
                          >
                            {img.orden}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="text-bukis-ink">
                  <h1 className="mb-2 text-4xl font-bold leading-tight text-bukis-ink">
                    {product.nombre}
                  </h1>

                  <hr className="my-4 border-bukis-border" />

                  {/* Datos: descripción primero, sin categoría */}
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Descripción
                      </div>
                      <div className="text-bukis-ink">
                        {product.descripcion}
                      </div>
                    </div>

                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Código de Ítem
                      </div>
                      <div className="text-bukis-ink">
                        {selectedVariant?.item ?? "N/A"}
                      </div>
                    </div>

                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Precio
                      </div>
                      <div className="font-semibold text-bukis-red-700">
                        ${Number(displayedPrice).toFixed(2)} MXN
                      </div>
                    </div>

                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Peso
                      </div>
                      <div className="text-bukis-ink">
                        {product.peso}
                      </div>
                    </div>

                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Medidas
                      </div>
                      <div className="text-bukis-ink">
                        {product.medidas}
                      </div>
                    </div>

                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                      <div className="font-medium text-neutral-500">
                        Capacidad
                      </div>
                      <div className="text-bukis-ink">
                        {product.capacidad || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Sin divisor antes de color, directo abajo */}
                  <hr className="my-4 border-bukis-border" />
                  {product.variantes?.length > 0 && (
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                        <div className="font-medium text-neutral-500">
                          Color
                        </div>
                        <div className="text-bukis-ink">
                          {selectedVariant?.color?.nombre ?? "Selecciona"}
                        </div>
                      </div>

                      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                        <div className="font-medium text-neutral-500">
                          Disponibilidad
                        </div>
                        <div className={isDisponible ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
                          {isDisponible ? "Disponible" : "No disponible"}
                        </div>
                      </div>

                      {/* Swatches: solo círculos */}
                      <div className="flex flex-wrap gap-3">
                        {product.variantes.map((v) => {
                          const selected = v.id === selectedVariantId;
                          const disabled = !v.disponible;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariantId(v.id)}
                              disabled={disabled}
                              title={disabled ? "Agotado" : "Disponible"}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                border: selected ? "2px solid #111" : "1px solid #cfcfcf",
                                outline: selected ? "3px solid rgba(0,0,0,0.12)" : "none",
                                background: v.color.hex,
                                opacity: disabled ? 0.35 : 1,
                                cursor: disabled ? "not-allowed" : "pointer",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Buy box */}
                <div>
                  <div className="sticky top-24 rounded-2xl bg-neutral-950 p-5 text-white shadow-bukis-soft">
                    <p className={`mb-3 font-semibold ${canBuy ? "text-emerald-300" : "text-red-300"}`}>
                      {canBuy ? "Disponible" : "Revisar stock"}
                    </p>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">Cantidad</label>
                        <input
                          className="w-full rounded-xl border border-neutral-700 bg-white px-3 py-2 text-bukis-ink outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:bg-neutral-200"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          value={qtyRaw}
                          onChange={(e) => {
                            setQtyRaw(e.target.value);
                            setQtyError(null);
                          }}
                          onBlur={() => {
                            if (validation.ok) setQtyError(null);
                            else setQtyError(validation.msg);
                          }}
                          disabled={!selectedVariant || !isDisponible || stock <= 0}
                        />

                      {(qtyError || (!validation.ok && qtyRaw.trim() !== "")) && (
                        <p className="mt-2 text-sm text-red-300">
                          {qtyError ?? validation.msg}
                        </p>
                      )}

                      {selectedVariant && isDisponible && stock > 0 && (
                        <p className="mt-2 text-sm text-neutral-300">
                          Disponible para compra
                        </p>
                      )}
                    </div>

                        <button
                          className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-neutral-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!validation.ok}
                          onClick={async () => {
                            if (!validation.ok) {
                              setQtyError(validation.msg);
                              return;
                            }

                            if (!selectedVariant) {
                              setQtyError("Selecciona una variante.");
                              return;
                            }

                            if (!localStorage.getItem("access") && !localStorage.getItem("token")) {
                              window.location.href = "/iniciar-sesion";
                              return;
                            }

                            try {
                              await addItem(selectedVariant.id, qty as number);
                              alert("Producto agregado al carrito");
                            } catch (error: unknown) {
                              const detail =
                                error != null &&
                                typeof error === "object" &&
                                "response" in error &&
                                (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;
                              alert(detail ?? "Error al agregar al carrito");
                            }
                          }}
 
                        >
                          Agregar al carrito
                        </button>

                    <div className="mt-4">
                      <p className="text-xs text-neutral-400">
                        Nota: aquí solo validamos payload. El endpoint lo conectamos después.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-bukis-border" />

              {/* Más productos: mismo componente del Home, sin textos grises */}
              <section className="pt-5">
                <h2 className="mb-4 text-3xl font-bold text-bukis-ink">
                  Más productos
                </h2>

                {moreLoading && <p className="text-neutral-600">Cargando productos...</p>}
                {moreError && <p className="text-bukis-red-700">{moreError}</p>}

                {!moreLoading && !moreError && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {moreProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
      </main>

      <Footer />
    </>
  );
}
