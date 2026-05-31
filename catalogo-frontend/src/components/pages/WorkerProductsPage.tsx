import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkerVariants, crearVariante, subirImagen, crearProducto } from "../../services/worker";
import API from "../../api";
import type { WorkerVariant } from "../../types/worker";
import {
  surface,
  ink,
  semantic,
} from "../elements/workerTheme";

// ─── local types ─────────────────────────────────────────────────
type Color     = { id: number; nombre: string; hex: string };
type Categoria = { id: number; nombre: string };
type Producto  = { id: number; nombre: string };

// ─── collapsible section ─────────────────────────────────────────
function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${surface.border}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          color: ink.primary,
          textAlign: "left",
        }}
      >
        {title}
        <span style={{ fontSize: 12, color: ink.tertiary, lineHeight: 1 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── form field ──────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div className="field">
      <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>
        {label}{required && " *"}
      </label>
      <div className="control">
        <input
          className="input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}

// ─── save button ─────────────────────────────────────────────────
function SaveBtn({ loading, label = "Guardar" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`button is-dark${loading ? " is-loading" : ""}`}
      style={{ alignSelf: "flex-end", marginTop: 4 }}
    >
      {loading ? "Guardando…" : label}
    </button>
  );
}

// ─── confirm modal ───────────────────────────────────────────────
function ConfirmModal({
  msg, onConfirm, onCancel,
}: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="box"
        style={{
          maxWidth: 360,
          width: "90%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontWeight: 500, color: ink.primary, fontSize: 14 }}>{msg}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="button is-outlined" onClick={onCancel}>Cancelar</button>
          <button className="button is-dark" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────
export default function WorkerProductsPage() {
  const navigate = useNavigate();
  const [variants, setVariants]       = useState<WorkerVariant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [catFilter, setCatFilter]     = useState("ALL");
  const [panelOpen, setPanelOpen]     = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  const [editId, setEditId]           = useState<number | null>(null);
  const [editStock, setEditStock]     = useState("");
  const [editActivo, setEditActivo]   = useState(false);
  const [savingEdit, setSavingEdit]   = useState(false);
  const [editError, setEditError]     = useState<string | null>(null);
  const [confirmEdit, setConfirmEdit] = useState(false);

  const [colores, setColores]         = useState<Color[]>([]);
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [productos, setProductos]     = useState<Producto[]>([]);

  const panelRef = useRef<HTMLDivElement>(null);

  const reload = (): Promise<void> => {
    setLoading(true);
    setFetchError(null);
    return getWorkerVariants()
      .then(setVariants)
      .catch((e: unknown) =>
        setFetchError(e instanceof Error ? e.message : "Error al cargar variantes")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    API.get("/api/categorias/")
      .then((r) => r.data)
      .then((data) => setCategorias(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch((err: unknown) => console.error("Error cargando categorías:", err));
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    let cancelled = false;
    const normalize = (d: unknown) =>
      Array.isArray(d) ? d : (d as { results?: unknown[] })?.results ?? [];
    Promise.all([
      API.get("/api/colores/").then((r) => r.data),
      API.get("/api/productos/").then((r) => r.data),
    ])
      .then(([c, p]) => {
        if (cancelled) return;
        setColores(normalize(c));
        setProductos(normalize(p));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Error cargando datos del panel:", err);
      });
    return () => { cancelled = true; };
  }, [panelOpen]);

  const categories = useMemo(() => {
    const catMap = new Map(categorias.map((c) => [c.id, c.nombre]));
    const set = new Set<string>();
    variants.forEach((v) => {
      v.producto.categorias?.forEach((id) => {
        const name = catMap.get(id);
        if (name) set.add(name);
      });
    });
    return Array.from(set).sort();
  }, [variants, categorias]);

  const filtered = useMemo(() => {
    const catId = catFilter !== "ALL"
      ? categorias.find((c) => c.nombre === catFilter)?.id
      : undefined;
    return variants.filter((v) => {
      const matchName = v.producto.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        catFilter === "ALL" ||
        (catId !== undefined && v.producto.categorias?.includes(catId));
      return matchName && matchCat;
    });
  }, [variants, search, catFilter, categorias]);

  const startEdit = (v: WorkerVariant) => {
    setEditId(v.variant_id);
    setEditStock(String(v.stock));
    setEditActivo(v.activo);
  };

  const cancelEdit = () => { setEditId(null); setEditError(null); };

  const handleSaveEdit = async () => {
    if (editId === null) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await API.patch(`/api/producto-variantes/${editId}/`, { stock: Number(editStock), activo: editActivo });
      await reload();
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSavingEdit(false);
      setConfirmEdit(false);
    }
  };

  return (
    <div className="worker-page" style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Page header ── */}
      <div className="level" style={{ marginBottom: "1.5rem" }}>
        <div className="level-left">
          <div>
            <h1 className="title is-4">Productos</h1>
            <p className="subtitle is-6">Inventario por variante</p>
          </div>
        </div>
        <div className="level-right">
          <button
            className="button is-dark"
            onClick={() => setPanelOpen((o) => !o)}
          >
            Utilidades
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="field is-grouped" style={{ marginBottom: "1rem" }}>
        <div className="control is-expanded">
          <input
            className="input"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="control">
          <div className="select">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="ALL">Todas las categorías</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Edit error ── */}
      {editError && (
        <div className="notification is-danger is-light" style={{ marginBottom: "1rem" }}>
          <p className="has-text-danger">{editError}</p>
        </div>
      )}

      {/* ── Fetch error ── */}
      {fetchError && (
        <div className="notification is-danger is-light" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12 }}>
          <span>
            {fetchError.includes("401") || fetchError.includes("403")
              ? "No autenticado. Inicia sesión como worker para ver los productos."
              : fetchError}
          </span>
          {(fetchError.includes("401") || fetchError.includes("403")) && (
            <button
              className="button is-danger is-small"
              onClick={() => navigate("/iniciar-sesion")}
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Ir al login
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p style={{ fontSize: 13, color: ink.secondary }}>Cargando…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table is-striped is-hoverable is-fullwidth">
            <thead className="worker-table-header">
              <tr>
                {["Imagen", "Nombre", "No.Item", "Color", "Stock", "Activo", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#fff", fontWeight: 600, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isEditing = editId === v.variant_id;
                const stockColor =
                  v.stock === 0
                    ? semantic.danger.fg
                    : v.stock < 5
                    ? semantic.warning.fg
                    : ink.primary;

                return (
                  <tr key={v.variant_id}>
                    {/* Image */}
                    <td style={{ padding: "8px 16px" }}>
                      {v.imagen_principal ? (
                        <img
                          src={v.imagen_principal}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: surface.inset,
                            borderRadius: 6,
                            border: `1px solid ${surface.border}`,
                          }}
                        />
                      )}
                    </td>

                    {/* Name */}
                    <td style={{ padding: "8px 16px", fontWeight: 500, color: ink.primary }}>
                      {v.producto.nombre}
                    </td>

                    {/* Item # */}
                    <td style={{ padding: "8px 16px", fontSize: 13, color: ink.secondary }}>
                      {v.item}
                    </td>

                    {/* Color */}
                    <td style={{ padding: "8px 16px" }}>
                      <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: v.color.hex,
                            border: `1px solid ${surface.borderMid}`,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: ink.secondary }}>{v.color.nombre}</span>
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "8px 16px" }}>
                      {isEditing ? (
                        <input
                          className="input"
                          type="number"
                          value={editStock}
                          min={0}
                          onChange={(e) => setEditStock(e.target.value)}
                          style={{ width: 72, padding: "4px 8px" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500, color: stockColor, fontSize: 14 }}>
                          {v.stock}
                        </span>
                      )}
                    </td>

                    {/* Active */}
                    <td style={{ padding: "8px 16px" }}>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editActivo}
                          onChange={(e) => setEditActivo(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                      ) : (
                        <span
                          className="tag"
                          style={{
                            backgroundColor: v.activo ? semantic.success.fg : ink.tertiary,
                            color: "#fff",
                          }}
                        >
                          {v.activo ? "Sí" : "No"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "8px 16px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="button is-dark is-small"
                            onClick={() => setConfirmEdit(true)}
                            disabled={savingEdit}
                          >
                            Guardar
                          </button>
                          <button
                            className="button is-outlined is-small"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="button is-ghost"
                          onClick={() => startEdit(v)}
                          title="Editar"
                          style={{ fontSize: 18 }}
                        >
                          ✏️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: ink.tertiary,
                      fontSize: 14,
                    }}
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Confirm modal ── */}
      {confirmEdit && (
        <ConfirmModal
          msg="¿Seguro que deseas guardar los cambios del producto?"
          onConfirm={handleSaveEdit}
          onCancel={() => setConfirmEdit(false)}
        />
      )}

      {/* ── Drawer overlay ── */}
      {panelOpen && (
        <div
          className="worker-drawer-overlay"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* ── Utilities drawer ── */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="worker-drawer"
        >
          {/* Drawer header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: `1px solid ${surface.border}`,
            }}
          >
            <h3 className="title is-6" style={{ margin: 0 }}>Utilidades</h3>
            <button
              className="button is-ghost"
              onClick={() => setPanelOpen(false)}
              style={{ fontSize: 18 }}
            >
              ✕
            </button>
          </div>

          <Seccion title="Colores">
            <CrearColorForm
              onCreated={() => {
                API.get("/api/colores/").then((r) => setColores(r.data));
              }}
            />
          </Seccion>

          <Seccion title="Categorías">
            <CrearCategoriaForm
              onCreated={() => {
                API.get("/api/categorias/").then((r) => setCategorias(r.data));
              }}
            />
          </Seccion>

          <Seccion title="Crear Producto Base">
            <CrearProductoForm
              categorias={categorias}
              onCreated={() => {
                reload();
                API.get("/api/productos/").then((r) => setProductos(r.data));
              }}
            />
          </Seccion>

          <Seccion title="Crear Variantes e Imágenes">
            <CrearVarianteForm
              productos={productos}
              colores={colores}
              onCreated={reload}
            />
          </Seccion>
        </div>
      )}
    </div>
  );
}

// ─── sub-forms ───────────────────────────────────────────────────

function CrearColorForm({ onCreated }: { onCreated: () => void }) {
  const [nombre, setNombre]         = useState("");
  const [hex, setHex]               = useState("#000000");
  const [disponible, setDisponible] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await API.post("/api/colores/", { nombre, hex, disponible });
      setNombre(""); setHex("#000000"); setDisponible(true);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="Nombre" value={nombre} onChange={setNombre} required />
      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>HEX *</label>
        <div className="control">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              style={{
                width: 40,
                height: 34,
                border: `1px solid ${surface.borderMid}`,
                borderRadius: 6,
                cursor: "pointer",
                padding: 2,
              }}
            />
            <input
              className="input"
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: ink.secondary }}>
        <input
          type="checkbox"
          checked={disponible}
          onChange={(e) => setDisponible(e.target.checked)}
        />
        Disponible
      </label>
      {error && <p style={{ color: semantic.danger.fg, fontSize: 12, margin: 0 }}>{error}</p>}
      <SaveBtn loading={saving} />
    </form>
  );
}

function CrearCategoriaForm({ onCreated }: { onCreated: () => void }) {
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await API.post("/api/categorias/", { nombre });
      setNombre("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="Nombre" value={nombre} onChange={setNombre} required />
      {error && <p style={{ color: semantic.danger.fg, fontSize: 12, margin: 0 }}>{error}</p>}
      <SaveBtn loading={saving} />
    </form>
  );
}

function CrearProductoForm({ categorias, onCreated }: { categorias: Categoria[]; onCreated: () => void }) {
  const [form, setForm] = useState({
    nombre: "", descripcion: "", precio: "",
    peso: "", medidas: "", capacidad: "", categoria: "",
  });
  const [imagen, setImagen] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagen) { setError("Selecciona una imagen"); return; }
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("imagen", imagen);
      if (form.categoria) fd.append("categorias_ids", form.categoria);
      await crearProducto(fd);
      setForm({ nombre: "", descripcion: "", precio: "", peso: "", medidas: "", capacidad: "", categoria: "" });
      setImagen(null);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Nombre"   value={form.nombre}   onChange={set("nombre")}   required />
        <Field label="Precio"   value={form.precio}   onChange={set("precio")}   type="number" required />
        <Field label="Peso"     value={form.peso}     onChange={set("peso")}     type="number" required />
        <Field label="Medidas"  value={form.medidas}  onChange={set("medidas")}  required />
        <Field label="Capacidad" value={form.capacidad} onChange={set("capacidad")} />
      </div>

      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Descripción</label>
        <div className="control">
          <textarea
            className="textarea"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            rows={2}
            style={{ resize: "vertical" }}
          />
        </div>
      </div>

      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Categoría</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Imagen *</label>
        <div className="control">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
            style={{ fontSize: 13, color: ink.secondary }}
          />
        </div>
      </div>

      {error && <p style={{ color: semantic.danger.fg, fontSize: 12, margin: 0 }}>{error}</p>}
      <SaveBtn loading={saving} label="Insertar" />
    </form>
  );
}

function CrearVarianteForm({
  productos, colores, onCreated,
}: { productos: Producto[]; colores: Color[]; onCreated: () => void }) {
  const [productoId, setProductoId] = useState("");
  const [colorId, setColorId]       = useState("");
  const [item, setItem]             = useState("");
  const [stock, setStock]           = useState("0");
  const [activo, setActivo]         = useState(true);
  const [imagenes, setImagenes]     = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  useEffect(() => {
    const urls = imagenes.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [imagenes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || !colorId) { setError("Selecciona producto y color"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await crearVariante(Number(productoId), {
        color: Number(colorId),
        stock: Number(stock),
        activo,
        item,
      });

      for (let i = 0; i < imagenes.length; i++) {
        const fd = new FormData();
        fd.append("imagen", imagenes[i]);
        fd.append("orden", String(i));
        fd.append("es_principal", i === 0 && esPrincipal ? "true" : "false");
        await subirImagen(Number(productoId), fd);
      }

      setProductoId(""); setColorId(""); setItem(""); setStock("0"); setActivo(true);
      setImagenes([]); setEsPrincipal(false);
      setSuccess("Variante creada correctamente");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Producto base *</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
            >
              <option value="">Selecciona el producto base</option>
              {productos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Color *</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              required
            >
              <option value="">Selecciona un color</option>
              {colores.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.nombre} ({c.hex})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Field label="No. Item (SKU)" value={item} onChange={setItem} required />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "end" }}>
        <Field label="Stock" value={stock} onChange={setStock} type="number" required />
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: ink.secondary, paddingBottom: 2 }}>
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          Activo
        </label>
      </div>

      <div className="field">
        <label className="label" style={{ fontSize: 12, color: ink.secondary, fontWeight: 500 }}>Imágenes (opcional)</label>
        <div className="control">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImagenes(Array.from(e.target.files ?? []))}
            style={{ fontSize: 13, color: ink.secondary }}
          />
        </div>
        {imagenes.length > 0 && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: ink.secondary, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
            />
            Primera imagen como principal
          </label>
        )}
        {imagenes.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {imagenes.map((_, i) => (
              <img
                key={i}
                src={previewUrls[i]}
                alt=""
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: `1px solid ${surface.border}`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {error   && <p style={{ color: semantic.danger.fg,  fontSize: 12, margin: 0 }}>{error}</p>}
      {success && <p style={{ color: semantic.success.fg, fontSize: 12, margin: 0 }}>{success}</p>}
      <SaveBtn loading={saving} label="Guardar variante" />
    </form>
  );
}
