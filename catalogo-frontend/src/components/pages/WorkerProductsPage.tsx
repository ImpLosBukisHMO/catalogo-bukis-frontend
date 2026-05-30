import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkerVariants, crearVariante, subirImagen, crearProducto } from "../../services/worker";
import API from "../../api";
import type { WorkerVariant } from "../../types/worker";
import {
  card,
  surface,
  ink,
  semantic,
  btn,
  control,
  tableHead,
  typo,
  sp,
  r,
  pageHeaderRow,
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
          padding: `${sp.md}px ${sp.lg}px`,
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
        <div style={{ padding: `0 ${sp.lg}px ${sp.lg}px` }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
      <label style={typo.label}>
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={control}
      />
    </div>
  );
}

// ─── save button ─────────────────────────────────────────────────
function SaveBtn({ loading, label = "Guardar" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{ ...(loading ? btn.disabled : btn.primary), alignSelf: "flex-end", marginTop: sp.xs }}
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
        style={{
          ...card,
          maxWidth: 360,
          width: "90%",
          display: "flex",
          flexDirection: "column",
          gap: sp.lg,
        }}
      >
        <p style={{ margin: 0, fontWeight: 500, color: ink.primary, fontSize: 14 }}>{msg}</p>
        <div style={{ display: "flex", gap: sp.sm, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btn.secondary}>Cancelar</button>
          <button onClick={onConfirm} style={btn.primary}>Confirmar</button>
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
  const [confirmEdit, setConfirmEdit] = useState(false);

  const [colores, setColores]         = useState<Color[]>([]);
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [productos, setProductos]     = useState<Producto[]>([]);

  const panelRef = useRef<HTMLDivElement>(null);

  const reload = () => {
    setLoading(true);
    setFetchError(null);
    getWorkerVariants()
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
      .then((data) => setCategorias(Array.isArray(data) ? data : (data?.results ?? [])));
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const normalize = (d: unknown) =>
      Array.isArray(d) ? d : (d as any)?.results ?? [];
    Promise.all([
      API.get("/api/colores/").then((r) => r.data),
      API.get("/api/productos/").then((r) => r.data),
    ]).then(([c, p]) => {
      setColores(normalize(c));
      setProductos(normalize(p));
    });
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

  const cancelEdit = () => setEditId(null);

  const handleSaveEdit = async () => {
    if (editId === null) return;
    setSavingEdit(true);
    try {
      await API.patch(`/api/producto-variantes/${editId}/`, { stock: Number(editStock), activo: editActivo });
      reload();
      setEditId(null);
    } catch {
      alert("Error al guardar cambios");
    } finally {
      setSavingEdit(false);
      setConfirmEdit(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Page header ── */}
      <div style={pageHeaderRow}>
        <div>
          <h1 style={typo.pageTitle}>Productos</h1>
          <p style={typo.subtitle}>Inventario por variante</p>
        </div>
        <button
          onClick={() => setPanelOpen((o) => !o)}
          style={btn.primary}
        >
          Utilidades
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: sp.md, marginBottom: sp.lg }}>
        <input
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...control, flex: 1, width: "auto" }}
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{ ...control, width: "auto" }}
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Fetch error ── */}
      {fetchError && (
        <div
          style={{
            background: semantic.danger.bg,
            border: `1px solid ${semantic.danger.border}`,
            borderRadius: r.md,
            padding: `${sp.md}px ${sp.lg}px`,
            color: semantic.danger.fg,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: sp.md,
            marginBottom: sp.lg,
          }}
        >
          <span>
            {fetchError.includes("401") || fetchError.includes("403")
              ? "No autenticado. Inicia sesión como worker para ver los productos."
              : fetchError}
          </span>
          {(fetchError.includes("401") || fetchError.includes("403")) && (
            <button
              onClick={() => navigate("/login")}
              style={{ ...btn.danger, fontSize: 13, padding: `6px ${sp.md}px`, whiteSpace: "nowrap" }}
            >
              Ir al login
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p style={typo.small}>Cargando…</p>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: r.lg, border: `1px solid ${surface.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Imagen", "Nombre", "No.Item", "Color", "Stock", "Activo", ""].map((h) => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const isEditing = editId === v.variant_id;
                const stockColor =
                  v.stock === 0
                    ? semantic.danger.fg
                    : v.stock < 5
                    ? semantic.warning.fg
                    : ink.primary;

                return (
                  <tr
                    key={v.variant_id}
                    style={{
                      background: i % 2 === 0 ? surface.card : surface.inset,
                      borderBottom: `1px solid ${surface.border}`,
                    }}
                  >
                    {/* Image */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px` }}>
                      {v.imagen_principal ? (
                        <img
                          src={v.imagen_principal}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: r.sm }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: surface.inset,
                            borderRadius: r.sm,
                            border: `1px solid ${surface.border}`,
                          }}
                        />
                      )}
                    </td>

                    {/* Name */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px`, fontWeight: 500, color: ink.primary }}>
                      {v.producto.nombre}
                    </td>

                    {/* Item # */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px`, ...typo.small }}>
                      {v.item}
                    </td>

                    {/* Color */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px` }}>
                      <span style={{ display: "flex", gap: sp.sm, alignItems: "center", fontSize: 13 }}>
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
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px` }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          min={0}
                          onChange={(e) => setEditStock(e.target.value)}
                          style={{ ...control, width: 72, padding: "4px 8px" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500, color: stockColor, fontSize: 14 }}>
                          {v.stock}
                        </span>
                      )}
                    </td>

                    {/* Active */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px` }}>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editActivo}
                          onChange={(e) => setEditActivo(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: v.activo ? semantic.success.fg : ink.tertiary,
                          }}
                        >
                          {v.activo ? "Sí" : "No"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: `${sp.sm}px ${sp.lg}px` }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: sp.sm }}>
                          <button
                            onClick={() => setConfirmEdit(true)}
                            style={{ ...btn.primary, fontSize: 13, padding: `5px ${sp.md}px` }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ ...btn.secondary, fontSize: 13, padding: `5px ${sp.md}px` }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(v)}
                          title="Editar"
                          style={btn.ghost}
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
                      padding: sp["3xl"],
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

      {/* ── Utilities panel ── */}
      {panelOpen && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 380,
            height: "100vh",
            background: surface.card,
            boxShadow: "-2px 0 20px rgba(15,23,42,0.10)",
            zIndex: 500,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: `${sp.lg}px ${sp.xl}px`,
              borderBottom: `1px solid ${surface.border}`,
            }}
          >
            <h3 style={typo.sectionTitle}>Utilidades</h3>
            <button
              onClick={() => setPanelOpen(false)}
              style={btn.ghost}
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
      <Field label="Nombre" value={nombre} onChange={setNombre} required />
      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>HEX *</label>
        <div style={{ display: "flex", gap: sp.sm, alignItems: "center" }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            style={{
              width: 40,
              height: 34,
              border: `1px solid ${surface.borderMid}`,
              borderRadius: r.sm,
              cursor: "pointer",
              padding: 2,
            }}
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            style={{ ...control, flex: 1, width: "auto" }}
          />
        </div>
      </div>
      <label style={{ display: "flex", gap: sp.sm, alignItems: "center", fontSize: 13, color: ink.secondary }}>
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sp.sm }}>
        <Field label="Nombre"   value={form.nombre}   onChange={set("nombre")}   required />
        <Field label="Precio"   value={form.precio}   onChange={set("precio")}   type="number" required />
        <Field label="Peso"     value={form.peso}     onChange={set("peso")}     type="number" required />
        <Field label="Medidas"  value={form.medidas}  onChange={set("medidas")}  required />
        <Field label="Capacidad" value={form.capacidad} onChange={set("capacidad")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          rows={2}
          style={{ ...control, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Categoría</label>
        <select
          value={form.categoria}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          style={control}
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Imagen *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13, color: ink.secondary }}
        />
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
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || !colorId) { setError("Selecciona producto y color"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await crearVariante(Number(productoId), {
        item,
        color: Number(colorId),
        stock: Number(stock),
        activo,
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: sp.sm }}>
      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Producto base *</label>
        <select
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          required
          style={control}
        >
          <option value="">Selecciona el producto base</option>
          {productos.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Color *</label>
        <select
          value={colorId}
          onChange={(e) => setColorId(e.target.value)}
          required
          style={control}
        >
          <option value="">Selecciona un color</option>
          {colores.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.nombre} ({c.hex})</option>
          ))}
        </select>
      </div>

      <Field label="No. Item (SKU)" value={item} onChange={setItem} required />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sp.sm, alignItems: "end" }}>
        <Field label="Stock" value={stock} onChange={setStock} type="number" required />
        <label style={{ display: "flex", gap: sp.sm, alignItems: "center", fontSize: 13, color: ink.secondary, paddingBottom: 2 }}>
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          Activo
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <label style={typo.label}>Imágenes (opcional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImagenes(Array.from(e.target.files ?? []))}
          style={{ fontSize: 13, color: ink.secondary }}
        />
        {imagenes.length > 0 && (
          <label style={{ display: "flex", gap: sp.sm, alignItems: "center", fontSize: 13, color: ink.secondary }}>
            <input
              type="checkbox"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
            />
            Primera imagen como principal
          </label>
        )}
        {imagenes.length > 0 && (
          <div style={{ display: "flex", gap: sp.sm, flexWrap: "wrap", marginTop: sp.xs }}>
            {imagenes.map((f, i) => (
              <img
                key={i}
                src={URL.createObjectURL(f)}
                alt=""
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "cover",
                  borderRadius: r.sm,
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
