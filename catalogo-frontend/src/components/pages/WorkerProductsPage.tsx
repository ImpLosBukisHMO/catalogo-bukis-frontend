import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WorkerVariant } from "../../types/worker";
import {
  useWorkerVariants,
  useWorkerCategorias,
  useWorkerColores,
  useWorkerProductosSlim,
  useEditarVariante,
  useCrearColor,
  useCrearCategoria,
} from "../../queries/workerProducts";
import { getStockColor } from "../elements/workerTheme";
import {
  WorkerDialogRoot,
  WorkerDialogContent,
  WorkerDialogHeader,
  WorkerDialogTitle,
  WorkerDialogDescription,
  WorkerDialogBody,
  WorkerDialogFooter,
  WorkerDialogCancel,
  WorkerDialogAction,
} from "../ui/worker/WorkerDialog";
import { WorkerCreateProductModal } from "../ui/worker/WorkerCreateProductModal";

// ─── local types ─────────────────────────────────────────────────
type PendingEdit = { variantId: number; stock: string; activo: boolean };

// ─── collapsible section ─────────────────────────────────────────
function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--worker-border-soft)" }}>
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
          color: "var(--worker-ink)",
          textAlign: "left",
        }}
      >
        {title}
        <span style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", lineHeight: 1 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "var(--worker-ink-secondary)", fontWeight: 500 }}>
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "7px 10px",
          fontSize: 13,
          background: "var(--worker-control-bg)",
          border: "1px solid var(--worker-control-border)",
          borderRadius: 6,
          color: "var(--worker-ink)",
        }}
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
      style={{
        alignSelf: "flex-end",
        marginTop: 4,
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        background: loading ? "var(--worker-ink-muted)" : "var(--worker-rail)",
        border: "none",
        borderRadius: 6,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Guardando…" : label}
    </button>
  );
}

// ─── main component ──────────────────────────────────────────────
export default function WorkerProductsPage() {
  const navigate = useNavigate();

  // ── Search / filter ──
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  // ── Utility drawer / create modal ──
  const [panelOpen, setPanelOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const prevCreateOpenRef = useRef(false);

  // ── Inline edit state ──
  const [editId, setEditId]         = useState<number | null>(null);
  const [editStock, setEditStock]   = useState("");
  const [editActivo, setEditActivo] = useState(false);
  const [editError, setEditError]   = useState<string | null>(null);

  // ── Confirm dialog ──
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [pendingEdit, setPendingEdit]         = useState<PendingEdit | null>(null);

  // ── React Query hooks ──
  const {
    data: variants = [],
    isLoading: loadingVariants,
    isError: isVariantsError,
    error: variantsError,
    isFetching,
  } = useWorkerVariants();

  const { data: categorias = [] } = useWorkerCategorias();
  const utilitiesOpen = panelOpen || createOpen;
  const { data: colores = [] }    = useWorkerColores(utilitiesOpen);
  const { data: productos = [] }  = useWorkerProductosSlim(utilitiesOpen);

  const editarVariante  = useEditarVariante();
  const crearColorM     = useCrearColor();
  const crearCategoriaM = useCrearCategoria();

  useEffect(() => {
    if (!createOpen && prevCreateOpenRef.current) {
      createTriggerRef.current?.focus();
    }
    prevCreateOpenRef.current = createOpen;
  }, [createOpen]);

  // ── Derived data ──
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

  // normalize variant name for rendering
  const variantName = (v: WorkerVariant) => v.producto.nombre;

  const startEdit = (v: WorkerVariant) => {
    setEditId(v.variant_id);
    setEditStock(String(v.stock));
    setEditActivo(v.activo);
    setEditError(null);
  };

  const cancelEdit = () => { setEditId(null); setEditError(null); };

  const requestSaveEdit = () => {
    if (editId === null) return;
    setPendingEdit({ variantId: editId, stock: editStock, activo: editActivo });
    setConfirmOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!pendingEdit) return;
    setEditError(null);
    try {
      await editarVariante.mutateAsync({
        variantId: pendingEdit.variantId,
        data: { stock: Number(pendingEdit.stock), activo: pendingEdit.activo },
      });
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setConfirmOpen(false);
      setPendingEdit(null);
    }
  };

  // ── Fetch error message ──
  const fetchErrorMsg = (() => {
    if (!isVariantsError) return null;
    const msg = variantsError instanceof Error ? variantsError.message : "Error al cargar variantes";
    if (msg.includes("401") || msg.includes("403")) {
      return "No autenticado. Inicia sesión como worker para ver los productos.";
    }
    return msg;
  })();

  const isAuthError = fetchErrorMsg?.includes("autenticado");

  const savingEdit = editarVariante.isPending;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--worker-canvas)",
        color: "var(--worker-ink)",
      }}
    >
      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--worker-ink)",
            }}
          >
            Productos
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--worker-ink-secondary)" }}>
            Inventario por variante
            {isFetching && !loadingVariants && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: "var(--worker-dispatch-fg)",
                  fontWeight: 500,
                }}
              >
                ↻ actualizando…
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            ref={createTriggerRef}
            onClick={() => setCreateOpen(true)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "var(--worker-rail)",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            Nuevo Producto
          </button>

          <button
            onClick={() => setPanelOpen((open) => !open)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--worker-ink-secondary)",
              background: "var(--worker-bench)",
              border: "1px solid var(--worker-border)",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            Utilidades
          </button>
        </div>
      </div>

      {createOpen && (
        <WorkerCreateProductModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          categorias={categorias}
          colores={colores}
          productos={productos}
        />
      )}

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--worker-control-bg)",
            border: "1px solid var(--worker-control-border)",
            borderRadius: 7,
            color: "var(--worker-ink)",
          }}
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--worker-control-bg)",
            border: "1px solid var(--worker-control-border)",
            borderRadius: 7,
            color: "var(--worker-ink)",
            cursor: "pointer",
          }}
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Edit error ── */}
      {editError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "10px 14px",
            background: "var(--worker-error-bg)",
            border: "1px solid var(--worker-error-border)",
            borderRadius: 7,
            fontSize: 13,
            color: "var(--worker-error-fg)",
          }}
        >
          {editError}
        </div>
      )}

      {/* ── Fetch error ── */}
      {fetchErrorMsg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "10px 14px",
            background: "var(--worker-error-bg)",
            border: "1px solid var(--worker-error-border)",
            borderRadius: 7,
            fontSize: 13,
            color: "var(--worker-error-fg)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{fetchErrorMsg}</span>
          {isAuthError && (
            <button
              onClick={() => navigate("/iniciar-sesion")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: "var(--worker-error-fg)",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Ir al login
            </button>
          )}
        </div>
      )}

      {/* ── Skeleton loading ── */}
      {loadingVariants ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderRadius: 6,
                background: "var(--worker-bench)",
                opacity: 0.5 + i * 0.06,
              }}
            />
          ))}
        </div>
      ) : (
        /* ── Table ── */
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#1e293b",
                  color: "#fff",
                }}
              >
                {["Imagen", "Nombre", "No.Item", "Color", "Stock", "Activo", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      fontSize: 13,
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isEditing = editId === v.variant_id;
                const stockColor = getStockColor(v.stock);

                return (
                  <tr
                    key={v.variant_id}
                    style={{
                      borderBottom: "1px solid var(--worker-border-soft)",
                      background: isEditing
                        ? "var(--worker-bench)"
                        : "transparent",
                    }}
                  >
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
                            background: "var(--worker-bench)",
                            borderRadius: 6,
                            border: "1px solid var(--worker-border)",
                          }}
                        />
                      )}
                    </td>

                    {/* Name */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontWeight: 500,
                        color: "var(--worker-ink)",
                      }}
                    >
                      {variantName(v)}
                    </td>

                    {/* Item # */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        color: "var(--worker-ink-secondary)",
                      }}
                    >
                      {v.item}
                    </td>

                    {/* Color */}
                    <td style={{ padding: "8px 16px" }}>
                      <span
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          fontSize: 13,
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: v.color.hex,
                            border: "1px solid var(--worker-border)",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "var(--worker-ink-secondary)" }}>
                          {v.color.nombre}
                        </span>
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "8px 16px" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          min={0}
                          onChange={(e) => setEditStock(e.target.value)}
                          style={{
                            width: 72,
                            padding: "4px 8px",
                            fontSize: 13,
                            background: "var(--worker-control-bg)",
                            border: "1px solid var(--worker-control-border)",
                            borderRadius: 5,
                            color: "var(--worker-ink)",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontWeight: 600,
                            color: stockColor,
                            fontSize: 14,
                          }}
                        >
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
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: v.activo
                              ? "var(--worker-inventory-bg)"
                              : "var(--worker-bench)",
                            color: v.activo
                              ? "var(--worker-inventory-fg)"
                              : "var(--worker-ink-muted)",
                            border: v.activo
                              ? "1px solid var(--worker-inventory-border)"
                              : "1px solid var(--worker-border)",
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
                            onClick={requestSaveEdit}
                            disabled={savingEdit}
                            style={{
                              padding: "5px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                              background: savingEdit
                                ? "var(--worker-ink-muted)"
                                : "var(--worker-rail)",
                              border: "none",
                              borderRadius: 5,
                              cursor: savingEdit ? "not-allowed" : "pointer",
                            }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              padding: "5px 12px",
                              fontSize: 12,
                              fontWeight: 500,
                              color: "var(--worker-ink-secondary)",
                              background: "var(--worker-bench)",
                              border: "1px solid var(--worker-border)",
                              borderRadius: 5,
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(v)}
                          title="Editar"
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: 18,
                            cursor: "pointer",
                            color: "var(--worker-ink-tertiary)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
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
                      color: "var(--worker-ink-tertiary)",
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

      {/* ── Confirm edit WorkerDialog ── */}
      <WorkerDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <WorkerDialogContent>
          <WorkerDialogHeader>
            <WorkerDialogTitle>Confirmar cambios</WorkerDialogTitle>
            <WorkerDialogDescription>
              ¿Guardar los cambios de stock y estado activo para esta variante?
            </WorkerDialogDescription>
          </WorkerDialogHeader>
          <WorkerDialogBody>
            {pendingEdit && (
              <div style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                <p style={{ margin: "0 0 4px" }}>
                  <strong style={{ color: "var(--worker-ink)" }}>Stock nuevo:</strong>{" "}
                  {pendingEdit.stock}
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: "var(--worker-ink)" }}>Activo:</strong>{" "}
                  {pendingEdit.activo ? "Sí" : "No"}
                </p>
              </div>
            )}
          </WorkerDialogBody>
          <WorkerDialogFooter>
            <WorkerDialogCancel>Cancelar</WorkerDialogCancel>
            <WorkerDialogAction
              onClick={handleConfirmEdit}
              disabled={savingEdit}
            >
              {savingEdit ? "Guardando…" : "Confirmar"}
            </WorkerDialogAction>
          </WorkerDialogFooter>
        </WorkerDialogContent>
      </WorkerDialogRoot>

      {/* ── Drawer overlay ── */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 499,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* ── Utilities drawer ── */}
      {panelOpen && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            width: 380,
            height: "100vh",
            zIndex: 500,
            background: "var(--worker-shelf)",
            overflowY: "auto",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Drawer header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid var(--worker-border)",
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--worker-ink)",
              }}
            >
              Utilidades
            </h3>
            <button
              onClick={() => setPanelOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "var(--worker-ink-tertiary)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>

          <Seccion title="Colores">
            <CrearColorForm
              onCreated={() => {
                crearColorM.reset();
              }}
              mutation={crearColorM}
            />
          </Seccion>

          <Seccion title="Categorías">
            <CrearCategoriaForm mutation={crearCategoriaM} />
          </Seccion>

        </div>
      )}
    </div>
  );
}

// ─── sub-forms ───────────────────────────────────────────────────

function CrearColorForm({
  onCreated,
  mutation,
}: {
  onCreated?: () => void;
  mutation: ReturnType<typeof useCrearColor>;
}) {
  const [nombre, setNombre]         = useState("");
  const [hex, setHex]               = useState("#000000");
  const [disponible, setDisponible] = useState(true);
  const [error, setError]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await mutation.mutateAsync({ nombre, hex, disponible });
      setNombre(""); setHex("#000000"); setDisponible(true);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="Nombre" value={nombre} onChange={setNombre} required />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, color: "var(--worker-ink-secondary)", fontWeight: 500 }}>
          HEX *
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            style={{
              width: 40,
              height: 34,
              border: "1px solid var(--worker-border)",
              borderRadius: 6,
              cursor: "pointer",
              padding: 2,
              background: "var(--worker-control-bg)",
            }}
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: 13,
              background: "var(--worker-control-bg)",
              border: "1px solid var(--worker-control-border)",
              borderRadius: 6,
              color: "var(--worker-ink)",
            }}
          />
        </div>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--worker-ink-secondary)" }}>
        <input
          type="checkbox"
          checked={disponible}
          onChange={(e) => setDisponible(e.target.checked)}
        />
        Disponible
      </label>
      {error && <p style={{ color: "var(--worker-error-fg)", fontSize: 12, margin: 0 }}>{error}</p>}
      <SaveBtn loading={mutation.isPending} />
    </form>
  );
}

function CrearCategoriaForm({
  mutation,
}: {
  mutation: ReturnType<typeof useCrearCategoria>;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await mutation.mutateAsync(nombre);
      setNombre("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="Nombre" value={nombre} onChange={setNombre} required />
      {error && <p style={{ color: "var(--worker-error-fg)", fontSize: 12, margin: 0 }}>{error}</p>}
      <SaveBtn loading={mutation.isPending} />
    </form>
  );
}
