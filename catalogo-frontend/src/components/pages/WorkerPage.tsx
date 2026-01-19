import { useEffect, useMemo, useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { Categoria, Color, Producto, ProductoVariante, ProductoImagen } from "../../types/worker";
import {
  getCategorias,
  createCategoria,
  getColores,
  createColor,
  getProductos,
  createProducto,
  getVariantes,
  createVariante,
  getImagenes,
  uploadImagenGaleria,
} from "../../services/worker";

function WorkerPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);

  const [variantes, setVariantes] = useState<ProductoVariante[]>([]);
  const [imagenesProducto, setImagenesProducto] = useState<ProductoImagen[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Forms
  const [catNombre, setCatNombre] = useState("");
  const [colorNombre, setColorNombre] = useState("");
  const [colorHex, setColorHex] = useState("#000000");

  const [pNombre, setPNombre] = useState("");
  const [pItem, setPItem] = useState("");
  const [pDescripcion, setPDescripcion] = useState("");
  const [pPrecio, setPPrecio] = useState("0.00");
  const [pPeso, setPPeso] = useState("0.00");
  const [pMedidas, setPMedidas] = useState("");
  const [pCapacidad, setPCapacidad] = useState("");
  const [pCategoriaId, setPCategoriaId] = useState<number | "">("");
  const [pImagen, setPImagen] = useState<File | null>(null);

  const [vColorId, setVColorId] = useState<number | "">("");
  const [vStock, setVStock] = useState<number>(0);
  const [vActivo, setVActivo] = useState(true);

  const [gVarianteId, setGVarianteId] = useState<number | "">("");
  const [gOrden, setGOrden] = useState<number>(0);
  const [gPrincipal, setGPrincipal] = useState(false);
  const [gImagen, setGImagen] = useState<File | null>(null);

  const selectedProducto = useMemo(
    () => productos.find((p) => p.id === selectedProductoId) ?? null,
    [productos, selectedProductoId]
  );

  async function refreshBase() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const [cats, cols, prods] = await Promise.all([getCategorias(), getColores(), getProductos()]);
      setCategorias(cats);
      setColores(cols);
      setProductos(prods);
      if (!selectedProductoId && prods.length) setSelectedProductoId(prods[0].id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  async function refreshProductoSide(productoId: number) {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const [vars, imgs] = await Promise.all([getVariantes(productoId), getImagenes({ producto: productoId })]);
      setVariantes(vars);
      setImagenesProducto(imgs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error cargando variantes/imagenes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductoId) refreshProductoSide(selectedProductoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductoId]);

  async function onCreateCategoria() {
    setErr(null);
    setMsg(null);
    if (!catNombre.trim()) return setErr("Pon un nombre de categoría");
    setLoading(true);
    try {
      await createCategoria(catNombre.trim());
      setCatNombre("");
      setMsg("Categoría creada");
      await refreshBase();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error creando categoría");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateColor() {
    setErr(null);
    setMsg(null);
    if (!colorNombre.trim()) return setErr("Pon un nombre de color");
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) return setErr("Hex inválido. Debe venir como #RRGGBB");
    setLoading(true);
    try {
      await createColor(colorNombre.trim(), colorHex);
      setColorNombre("");
      setColorHex("#000000");
      setMsg("Color creado");
      await refreshBase();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error creando color");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateProducto() {
    setErr(null);
    setMsg(null);

    if (!pNombre.trim()) return setErr("Pon nombre");
    if (!pItem.trim()) return setErr("Pon item/SKU");
    if (!pCategoriaId) return setErr("Selecciona categoría");
    if (!pImagen) return setErr("Sube una imagen principal");

    setLoading(true);
    try {
      const created = await createProducto({
        nombre: pNombre.trim(),
        item: pItem.trim(),
        descripcion: pDescripcion,
        precio: pPrecio,
        peso: pPeso,
        medidas: pMedidas,
        capacidad: pCapacidad || "",
        categoria: Number(pCategoriaId),
        imagenFile: pImagen,
      });

      setMsg(`Producto creado: ${created.nombre}`);
      setPNombre("");
      setPItem("");
      setPDescripcion("");
      setPPrecio("0.00");
      setPPeso("0.00");
      setPMedidas("");
      setPCapacidad("");
      setPImagen(null);

      await refreshBase();
      setSelectedProductoId(created.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error creando producto");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateVariante() {
    setErr(null);
    setMsg(null);

    if (!selectedProductoId) return setErr("Selecciona un producto");
    if (!vColorId) return setErr("Selecciona un color");
    if (vStock < 0) return setErr("Stock no puede ser negativo");

    setLoading(true);
    try {
      await createVariante({
        producto_id: selectedProductoId,
        color_id: Number(vColorId),
        stock: Number(vStock),
        activo: Boolean(vActivo),
      });

      setMsg("Variante creada");
      setVColorId("");
      setVStock(0);
      setVActivo(true);

      await refreshProductoSide(selectedProductoId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error creando variante");
    } finally {
      setLoading(false);
    }
  }

  async function onUploadImagenGaleria() {
    setErr(null);
    setMsg(null);

    if (!selectedProductoId) return setErr("Selecciona un producto");
    if (!gImagen) return setErr("Sube una imagen");

    setLoading(true);
    try {
      await uploadImagenGaleria({
        producto_id: selectedProductoId,
        variante_id: gVarianteId === "" ? null : Number(gVarianteId),
        orden: Number(gOrden),
        es_principal: Boolean(gPrincipal),
        imagenFile: gImagen,
      });

      setMsg("Imagen subida");
      setGImagen(null);
      await refreshProductoSide(selectedProductoId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error subiendo imagen");
    } finally {
      setLoading(false);
    }
  }

  const principal = useMemo(() => {
    const list = [...imagenesProducto].sort((a, b) => a.orden - b.orden || a.id - b.id);
    return list.find((x) => x.es_principal) ?? list[0] ?? null;
  }, [imagenesProducto]);

  return (
    <>
      <title>Worker | Importaciones Los Bukis</title>
      <NavBar />

      <div className="container" style={{ padding: "1.5rem 1rem" }}>
        <div className="columns">
          <div className="column is-3">
            <h1 className="title is-4" style={{ marginBottom: "0.5rem" }}>Worker</h1>
            <p className="is-size-7" style={{ color: "#444" }}>
              Aquí haces lo mismo que en admin, pero sin pelearte con mil pestañas. El backend ya está domesticado.
            </p>

            <hr />

            <h2 className="title is-6">Productos</h2>
            <div className="select is-fullwidth">
              <select
                value={selectedProductoId ?? ""}
                onChange={(e) => setSelectedProductoId(e.target.value ? Number(e.target.value) : null)}
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.item})
                  </option>
                ))}
              </select>
            </div>

            {selectedProducto && (
              <div style={{ marginTop: "1rem" }}>
                {principal && (
                  <img
                    src={principal.imagen}
                    alt="principal"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd", objectFit: "cover" }}
                  />
                )}
                <p className="is-size-7" style={{ marginTop: "0.5rem", color: "#222" }}>
                  {selectedProducto.nombre}
                </p>
              </div>
            )}

            <hr />

            {loading && <p className="is-size-7">Cargando...</p>}
            {msg && <p className="is-size-7" style={{ color: "#156d2d" }}>{msg}</p>}
            {err && <p className="is-size-7" style={{ color: "#b00020" }}>{err}</p>}
          </div>

          <div className="column is-9">
            <div className="columns">
              <div className="column is-6">
                <div className="box">
                  <h3 className="title is-6">Crear categoría</h3>
                  <div className="field">
                    <label className="label">Nombre</label>
                    <div className="control">
                      <input className="input" value={catNombre} onChange={(e) => setCatNombre(e.target.value)} />
                    </div>
                  </div>
                  <button className="button is-dark" onClick={onCreateCategoria} disabled={loading}>
                    Crear
                  </button>
                </div>

                <div className="box">
                  <h3 className="title is-6">Crear color</h3>
                  <div className="field">
                    <label className="label">Nombre</label>
                    <div className="control">
                      <input className="input" value={colorNombre} onChange={(e) => setColorNombre(e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Hex</label>
                    <div className="control">
                      <input className="input" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
                    </div>
                    <p className="help">Ejemplo: #FF0000</p>
                  </div>
                  <button className="button is-dark" onClick={onCreateColor} disabled={loading}>
                    Crear
                  </button>
                </div>
              </div>

              <div className="column is-6">
                <div className="box">
                  <h3 className="title is-6">Crear producto</h3>

                  <div className="field">
                    <label className="label">Categoría</label>
                    <div className="control select is-fullwidth">
                      <select value={pCategoriaId} onChange={(e) => setPCategoriaId(e.target.value ? Number(e.target.value) : "")}>
                        <option value="">Selecciona</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Nombre</label>
                    <div className="control">
                      <input className="input" value={pNombre} onChange={(e) => setPNombre(e.target.value)} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Item/SKU</label>
                    <div className="control">
                      <input className="input" value={pItem} onChange={(e) => setPItem(e.target.value)} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Descripción</label>
                    <div className="control">
                      <textarea className="textarea" value={pDescripcion} onChange={(e) => setPDescripcion(e.target.value)} />
                    </div>
                  </div>

                  <div className="columns">
                    <div className="column">
                      <label className="label">Precio</label>
                      <input className="input" value={pPrecio} onChange={(e) => setPPrecio(e.target.value)} />
                    </div>
                    <div className="column">
                      <label className="label">Peso</label>
                      <input className="input" value={pPeso} onChange={(e) => setPPeso(e.target.value)} />
                    </div>
                  </div>

                  <div className="columns">
                    <div className="column">
                      <label className="label">Medidas</label>
                      <input className="input" value={pMedidas} onChange={(e) => setPMedidas(e.target.value)} />
                    </div>
                    <div className="column">
                      <label className="label">Capacidad</label>
                      <input className="input" value={pCapacidad} onChange={(e) => setPCapacidad(e.target.value)} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Imagen principal</label>
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPImagen(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <button className="button is-dark" onClick={onCreateProducto} disabled={loading}>
                    Crear producto
                  </button>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="box">
                  <h3 className="title is-6">Variantes del producto</h3>

                  <div className="field">
                    <label className="label">Color</label>
                    <div className="control select is-fullwidth">
                      <select value={vColorId} onChange={(e) => setVColorId(e.target.value ? Number(e.target.value) : "")}>
                        <option value="">Selecciona</option>
                        {colores.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.hex})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="columns">
                    <div className="column">
                      <label className="label">Stock</label>
                      <input
                        className="input"
                        type="number"
                        value={vStock}
                        onChange={(e) => setVStock(Number(e.target.value))}
                      />
                    </div>
                    <div className="column">
                      <label className="label">Activo</label>
                      <label className="checkbox" style={{ marginTop: "0.5rem" }}>
                        <input type="checkbox" checked={vActivo} onChange={(e) => setVActivo(e.target.checked)} /> activo
                      </label>
                    </div>
                  </div>

                  <button className="button is-dark" onClick={onCreateVariante} disabled={loading || !selectedProductoId}>
                    Crear variante
                  </button>

                  <hr />

                  <div className="content" style={{ maxHeight: 220, overflow: "auto" }}>
                    <ul>
                      {variantes.map((v) => (
                        <li key={v.id}>
                          {v.color.nombre} {v.color.hex} stock {v.stock} {v.activo ? "activo" : "inactivo"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="column is-6">
                <div className="box">
                  <h3 className="title is-6">Galería del producto</h3>

                  <div className="field">
                    <label className="label">Variante (opcional)</label>
                    <div className="control select is-fullwidth">
                      <select
                        value={gVarianteId}
                        onChange={(e) => setGVarianteId(e.target.value ? Number(e.target.value) : "")}
                      >
                        <option value="">Global</option>
                        {variantes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.color.nombre} ({v.color.hex})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="columns">
                    <div className="column">
                      <label className="label">Orden</label>
                      <input
                        className="input"
                        type="number"
                        value={gOrden}
                        onChange={(e) => setGOrden(Number(e.target.value))}
                      />
                    </div>
                    <div className="column">
                      <label className="label">Principal</label>
                      <label className="checkbox" style={{ marginTop: "0.5rem" }}>
                        <input type="checkbox" checked={gPrincipal} onChange={(e) => setGPrincipal(e.target.checked)} /> principal
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Imagen</label>
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setGImagen(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <button className="button is-dark" onClick={onUploadImagenGaleria} disabled={loading || !selectedProductoId}>
                    Subir imagen
                  </button>

                  <hr />

                  <div className="columns is-multiline">
                    {imagenesProducto
                      .slice()
                      .sort((a, b) => a.orden - b.orden || a.id - b.id)
                      .map((img) => (
                        <div className="column is-4" key={img.id}>
                          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 8 }}>
                            <img
                              src={img.imagen}
                              alt={`img-${img.id}`}
                              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 10 }}
                            />
                            <p className="is-size-7" style={{ marginTop: 6, color: "#222" }}>
                              id {img.id} orden {img.orden} {img.es_principal ? "principal" : ""}{" "}
                              {img.variante ? `var ${img.variante}` : "global"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default WorkerPage;
