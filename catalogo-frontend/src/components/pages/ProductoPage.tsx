import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import ProductCard from "../elements/ProductCard";

import {
  getProductById,
  getProductImages,
  getProducts,
  type ProductImage,
} from "../../services/product";

import { addItem } from "../../services/carrito";

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

export default function ProductoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);

  const [qtyRaw, setQtyRaw] = useState("1");
  const [qtyError, setQtyError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agregar al carrito (UI)
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);

  // Más productos
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

  const validation = useMemo(() => {
    if (!selectedVariant) return { ok: false, msg: "Selecciona una variante." };
    if (!isDisponible || stock <= 0) return { ok: false, msg: "Sin stock." };
    if (qty == null) return { ok: false, msg: "Ingresa una cantidad." };
    if (qty < 1) return { ok: false, msg: "La cantidad mínima es 1." };
    if (qty > stock) return { ok: false, msg: `Stock insuficiente. Máximo ${stock}.` };
    return { ok: true, msg: null as string | null };
  }, [qty, selectedVariant, isDisponible, stock]);

  const canBuy = validation.ok;

  // Cargar producto
  useEffect(() => {
    (async () => {
      try {
        if (!id) {
          setError("No se recibió id de producto");
          return;
        }

        setLoading(true);
        setError(null);

        const data = await getProductById(id);
        setProduct(data);

        const defVariantId = pickDefaultVariantId(data.variantes);
        setSelectedVariantId(defVariantId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Reset cantidad / mensajes al cambiar variante
  useEffect(() => {
    setQtyRaw("1");
    setQtyError(null);
    setAddMsg(null);
    setAddErr(null);
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

  // Cargar “Más productos”
  useEffect(() => {
    (async () => {
      try {
        setMoreLoading(true);
        setMoreError(null);

        const data: Product[] = await getProducts();

        const mapped: ProductCardVM[] = data
          .filter((p: any) => String(p.id) !== String(id))
          .map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.item ?? p.sku ?? "",
            precio: Number(p.precio),
            imagenUrl: p.imagen ?? p.imagenUrl ?? null,
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

  async function handleAddToCart() {
    setAddMsg(null);
    setAddErr(null);

    if (!validation.ok) {
      setQtyError(validation.msg);
      return;
    }
    if (!selectedVariant) return;

    const qtyFinal = qty as number;

    try {
      setAdding(true);
      await addItem(selectedVariant.id, qtyFinal);

      setAddMsg("Listo. Se agregó al carrito.");
      setAddErr(null);

      // opcional: si quieres mandarlo al carrito al agregar
      // navigate("/carrito");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al agregar al carrito";
      setAddErr(msg);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <title>Producto | Importaciones Los Bukis</title>
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
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          {loading && <p>Cargando producto...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && product && (
            <>
              <div className="columns is-variable is-7 is-align-items-flex-start">
                {/* Imagen */}
                <div className="column is-5">
                  <div className="box">
                    {imgLoading && <p className="mb-3">Cargando imágenes...</p>}

                    <figure
                      className="image is-square"
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          activeImage?.imagen ??
                          product.imagen ??
                          "https://placehold.net/600x600.png"
                        }
                        alt={product.nombre}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </figure>

                    {images.length > 1 && (
                      <div className="mt-4 is-flex is-flex-wrap-wrap" style={{ gap: "0.5rem" }}>
                        {images.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            className={`button is-small ${img.id === activeImageId ? "is-dark" : ""}`}
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
                <div className="column is-5" style={{ color: "#222" }}>
                  <h1 className="title is-2" style={{ marginBottom: "0.5rem", color: "#111" }}>
                    {product.nombre}
                  </h1>

                  <hr style={{ margin: "0.75rem 0 1rem" }} />

                  <div style={{ color: "#333" }}>
                    <div className="columns is-mobile" style={{ marginBottom: "0.25rem" }}>
                      <div className="column is-3" style={{ color: "#555" }}>Descripción</div>
                      <div className="column" style={{ color: "#111" }}>{product.descripcion}</div>
                    </div>

                    <div className="columns is-mobile" style={{ marginBottom: "0.25rem" }}>
                      <div className="column is-3" style={{ color: "#555" }}>No. ítem</div>
                      <div className="column" style={{ color: "#111" }}>{product.item}</div>
                    </div>

                    <div className="columns is-mobile" style={{ marginBottom: "0.25rem" }}>
                      <div className="column is-3" style={{ color: "#555" }}>Precio</div>
                      <div className="column" style={{ color: "#111" }}>
                        ${Number(product.precio).toFixed(2)} MXN
                      </div>
                    </div>

                    <div className="columns is-mobile" style={{ marginBottom: "0.25rem" }}>
                      <div className="column is-3" style={{ color: "#555" }}>Peso</div>
                      <div className="column" style={{ color: "#111" }}>{product.peso}</div>
                    </div>

                    <div className="columns is-mobile" style={{ marginBottom: "0.25rem" }}>
                      <div className="column is-3" style={{ color: "#555" }}>Medidas</div>
                      <div className="column" style={{ color: "#111" }}>{product.medidas}</div>
                    </div>

                    <div className="columns is-mobile">
                      <div className="column is-3" style={{ color: "#555" }}>Capacidad</div>
                      <div className="column" style={{ color: "#111" }}>{product.capacidad || "N/A"}</div>
                    </div>
                  </div>

                  {product.variantes?.length > 0 && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <div className="columns is-mobile" style={{ marginBottom: "0.5rem" }}>
                        <div className="column is-3" style={{ color: "#555" }}>Color</div>
                        <div className="column" style={{ color: "#111" }}>
                          {selectedVariant?.color?.nombre ?? "Selecciona"}
                        </div>
                      </div>

                      <div className="columns is-mobile" style={{ marginBottom: "0.75rem" }}>
                        <div className="column is-3" style={{ color: "#555" }}>Stock</div>
                        <div className="column" style={{ color: "#111" }}>
                          {selectedVariant ? selectedVariant.stock : "-"}
                        </div>
                      </div>

                      <div className="is-flex" style={{ gap: 10, flexWrap: "wrap" }}>
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
                                width: 34,
                                height: 34,
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
                <div className="column is-2">
                  <div
                    className="box"
                    style={{
                      background: "rgba(0,0,0,0.88)",
                      borderRadius: 12,
                      position: "sticky",
                      top: "1rem",
                    }}
                  >
                    <p className={`mb-3 ${canBuy ? "has-text-success" : "has-text-danger"}`}>
                      {canBuy ? "Disponible" : "Revisar stock"}
                    </p>

                    <div className="field">
                      <label className="label has-text-grey-light">Cantidad</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          value={qtyRaw}
                          onChange={(e) => {
                            setQtyRaw(e.target.value);
                            setQtyError(null);
                            setAddMsg(null);
                            setAddErr(null);
                          }}
                          onBlur={() => {
                            if (validation.ok) setQtyError(null);
                            else setQtyError(validation.msg);
                          }}
                          disabled={!selectedVariant || !isDisponible || stock <= 0 || adding}
                        />
                      </div>

                      {(qtyError || (!validation.ok && qtyRaw.trim() !== "")) && (
                        <p className="help is-danger" style={{ marginTop: 8 }}>
                          {qtyError ?? validation.msg}
                        </p>
                      )}

                      {selectedVariant && isDisponible && stock > 0 && (
                        <p className="help has-text-grey-light" style={{ marginTop: 8 }}>
                          Stock disponible: {stock}
                        </p>
                      )}
                    </div>

                    <div className="field mt-3">
                      <div className="control">
                        <button
                          className="button is-warning is-fullwidth"
                          disabled={!validation.ok || adding}
                          onClick={handleAddToCart}
                        >
                          {adding ? "Agregando..." : "Agregar al carrito"}
                        </button>
                      </div>
                    </div>

                    {addMsg && (
                      <div className="mt-3">
                        <p className="help has-text-success">{addMsg}</p>
                        <button
                          className="button is-small is-light mt-2"
                          onClick={() => navigate("/carrito")}
                        >
                          Ver carrito
                        </button>
                      </div>
                    )}

                    {addErr && (
                      <div className="mt-3">
                        <p className="help is-danger">{addErr}</p>
                      </div>
                    )}

                    <div className="content mt-4">
                      <p className="is-size-7 has-text-grey-light">
                        Si falla, casi siempre es token/credenciales o endpoint.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Más productos */}
              <section style={{ paddingTop: "1.25rem" }}>
                <h2 className="title is-3" style={{ color: "#111", marginBottom: "1rem" }}>
                  Más productos
                </h2>

                {moreLoading && <p>Cargando productos...</p>}
                {moreError && <p style={{ color: "red" }}>{moreError}</p>}

                {!moreLoading && !moreError && (
                  <div
                    className="is-flex is-justify-content-center is-align-items-center"
                    style={{ width: "100%", gap: "1rem", flexWrap: "wrap" }}
                  >
                    {moreProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
