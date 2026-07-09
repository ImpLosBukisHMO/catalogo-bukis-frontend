import { useEffect, useMemo, useState, useRef } from "react";
import {
  WorkerDialogAction,
  WorkerDialogBody,
  WorkerDialogCancel,
  WorkerDialogContent,
  WorkerDialogDescription,
  WorkerDialogFooter,
  WorkerDialogHeader,
  WorkerDialogRoot,
  WorkerDialogTitle
} from "../ui/worker/WorkerDialog";
import { useWorkerDescuentos, useEditarDescuento, useWorkerTiposDescuento } from "../../queries/workerDescuentos";
import { normalizeResponse } from "./responseNormalizer";
import type { Discount } from "../../types/descuento";
import { useNavigate } from "react-router";
import { stripDiacritics } from "../../utils/normalizers";
import { WorkerCreateDiscountModal } from "../ui/worker/WorkerCreateDiscountModal";
import { WorkerApplyDiscountModal } from "../ui/worker/WorkerApplyDiscountModal";

// ─── local types ─────────────────────────────────────────────────
type PendingDiscountEdit = {
  id: number;
  nombre?: string,
  tipo?: string,
  porcentaje?: number,
  activo?: boolean,
  fecha_inicio?: Date,
  fecha_fin?: Date
};

export function WorkerDiscountsPage() {
  const navigate = useNavigate();

  // ── Search / filter ──
  const [search, setSearch] = useState("");
  const [descTypeFilter, setDescTypeFilter] = useState("ALL");

  // ── Utility drawer / create modal ──
  const [panelOpen, setPanelOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyModalType, setApplyModalType] = useState<"general" | "especial">("general");

  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const prevCreateOpenRef = useRef(false);

  // ── Inline edit state ──
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editPorcentaje, setEditPorcentaje] = useState(0);
  const [editActivo, setEditActivo] = useState(false);
  const [editFechaInicio, setEditFechaInicio] = useState<string>("");
  const [editFechaFin, setEditFechaFin] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  // ── Confirm dialog ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<PendingDiscountEdit | null>(null);

  const {
    data: descuentosRaw = [],
    isLoading: loadingDiscounts,
    isError: isDiscountError,
    error: discountError,
    isFetching
  } = useWorkerDescuentos();

  const { mutateAsync: editarDescuentoMutate, isPending: savingEdit } = useEditarDescuento();
  const descuentos = useMemo(() => normalizeResponse(descuentosRaw) as Discount[], [descuentosRaw])
  const { data: tiposDescuento = [] } = useWorkerTiposDescuento();
  const tiposDescArray = tiposDescuento;

  useEffect(() => {
    if (!createOpen && prevCreateOpenRef.current) {
      createTriggerRef.current?.focus();
    }
    prevCreateOpenRef.current = createOpen;
  }, [createOpen]);

  const filtered = useMemo(() => {
    return descuentos.filter((d) => {
      const matchName = stripDiacritics(d.nombre).toLowerCase()
        .includes(stripDiacritics(search).toLowerCase());
      const matchTipo = descTypeFilter === "ALL" || d.tipo.toLowerCase() === descTypeFilter.toLowerCase();
      return matchName && matchTipo;
    });
  }, [search, descuentos, descTypeFilter]);

  // Convierte cualquier fecha ISO a formato YYYY-MM-DD requerido por input[type=date]
  const toDateInput = (iso: Date | string | undefined | null): string => {
    if (!iso) return "";
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const startEdit = (d: Discount) => {
    setEditId(d.id);
    setEditNombre(d.nombre ?? "");
    setEditTipo(d.tipo ?? "");
    setEditPorcentaje(d.porcentaje ?? 0);
    setEditActivo(d.activo);
    setEditFechaInicio(toDateInput(d.fecha_inicio));
    setEditFechaFin(toDateInput(d.fecha_fin));
    setEditError(null);
  };

  const cancelEdit = () => { setEditId(null); setEditError(null); };

  const requestSaveEdit = () => {
    if (editId === null) return;
    setPendingEdit({
      id: editId,
      nombre: editNombre,
      tipo: editTipo.toLowerCase(),
      porcentaje: editPorcentaje,
      activo: editActivo,
      fecha_inicio: new Date(editFechaInicio),
      fecha_fin: new Date(editFechaFin)
    });
    setConfirmOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!pendingEdit) return;
    setEditError(null);
    try {
      await editarDescuentoMutate({
        id: pendingEdit.id,
        data: {
          nombre: pendingEdit.nombre,
          tipo: pendingEdit.tipo,
          porcentaje: pendingEdit.porcentaje,
          activo: pendingEdit.activo,
          fecha_inicio: pendingEdit.fecha_inicio,
          fecha_fin: pendingEdit.fecha_fin
        },
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
    if (!isDiscountError) return null;
    const msg = discountError instanceof Error ? discountError.message : "Error al cargar descuentos";
    if (msg.includes("401") || msg.includes("403")) {
      return "No autenticado. Inicia sesión como worker para ver los productos.";
    }
    return msg;
  })();

  useEffect(() => {
    if (!createOpen && prevCreateOpenRef.current) {
      createTriggerRef.current?.focus();
    }
    prevCreateOpenRef.current = createOpen;
  }, [createOpen]);

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
            Descuentos
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--worker-ink-secondary)" }}>
            &nbsp;
            {isFetching && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: "var(--worker-dispatch-fg)",
                  fontWeight: 500,
                }}
              >
                ↻ Actualizando…
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            ref={createTriggerRef}
            onClick={() => setCreateOpen(true)}
            aria-haspopup="dialog"
            title="Crear descuento"
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
            Nuevo Descuento
          </button>
          <button
            onClick={() => {
              setApplyModalType("general");
              setApplyModalOpen(true);
            }}
            title="Aplicar descuento general"
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "var(--worker-inventory-fg)",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            Aplicar Descuento General
          </button>
          <button
            onClick={() => {
              setApplyModalType("especial");
              setApplyModalOpen(true);
            }}
            title="Aplicar descuento especial"
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "var(--worker-info-fg)",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            Aplicar Descuento Especial
          </button>
        </div>
      </div>

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
          placeholder="Buscar descuento por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={descTypeFilter}
          onChange={(e) => setDescTypeFilter(e.target.value)}
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
          <option value="ALL">Todos los tipos</option>
          {tiposDescArray.map((td) => (
            <option key={td} value={td}>
              {td[0].toUpperCase() + td.substring(1, td.length)}
            </option>))}
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
          {fetchErrorMsg?.includes("autenticado") && (
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
      {loadingDiscounts ? (
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
        <div className="max-h-[calc(100vh-180px)]" style={{ overflowX: "auto", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                className="sticky top-0 z-10"
                style={{
                  background: "#1e293b",
                  color: "#fff",
                }}
              >
                {["Nombre", "Tipo", "Porcentaje", "Fecha de Inicio", "Fecha de Fin", "Activo", "Acciones"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const isEditing = editId === d.id;
                return (
                  <tr
                    key={d.id}
                    style={{
                      borderBottom: "1px solid var(--worker-border-soft)",
                      background: isEditing
                        ? "var(--worker-bench)"
                        : "transparent",
                      height: "100%",
                    }}
                  >
                    {/* Nombre */
                      isEditing ? (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            style={{
                              width: 78,
                              padding: "4px 8px",
                              fontSize: 13,
                              background: "var(--worker-control-bg)",
                              border: "1px solid var(--worker-control-border)",
                              borderRadius: 5,
                              color: "var(--worker-ink)",
                            }} />
                        </td>
                      ) : (
                        <td
                          style={{
                            padding: "8px 16px",
                            fontWeight: 500,
                            color: "var(--worker-ink)",
                            textAlign: "center",
                          }}
                        >
                          {d.nombre}
                        </td>
                      )}

                    {/* Tipo */
                      isEditing ? (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}>
                          <select
                            id="d-tipo"
                            value={editTipo}
                            onChange={(e) => setEditTipo(e.target.value)}
                            style={{
                              width: 80,
                              padding: "4px 8px",
                              borderRadius: 8,
                              border: "1px solid var(--worker-control-border)",
                              fontSize: 13,
                              background: "var(--worker-control-bg)",
                              color: "var(--worker-ink)",
                              boxSizing: "border-box"
                            }}
                          >
                            {tiposDescArray.map((td) => (
                              <option key={td} value={td}>
                                {td[0].toUpperCase() + td.substring(1, td.length)}
                              </option>))}
                          </select>
                        </td>
                      ) : (
                        <td
                          style={{
                            padding: "8px 16px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {d.tipo[0].toUpperCase() + d.tipo.substring(1, d.tipo.length)}
                        </td>
                      )}

                    {/* Porcentaje */
                      isEditing ? (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}>
                          <div className="flex justify-center-safe content-center">
                            <input
                              type="number"
                              value={editPorcentaje}
                              min={0}
                              max={100}
                              onChange={(e) => {
                                let per = Number(e.target.value)
                                if (per > 100) per = 100
                                else if (per < 0) per = 0
                                setEditPorcentaje(per)
                              }}
                              style={{
                                width: 70,
                                padding: "4px 8px",
                                fontSize: 13,
                                background: "var(--worker-control-bg)",
                                border: "1px solid var(--worker-control-border)",
                                borderRadius: 5,
                                color: "var(--worker-ink)",
                              }} />
                            <p className="ms-1 my-auto">%</p>
                          </div>
                        </td>
                      ) : (
                        <td
                          style={{
                            padding: "8px 16px",
                            color: "var(--worker-ink)",
                            textAlign: "center",
                          }}
                        >
                          {`${d.porcentaje} %`}
                        </td>
                      )}

                    {/* Start date */
                      isEditing ? (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}>
                          <input
                            type="date"
                            value={editFechaInicio}
                            onChange={(e) => setEditFechaInicio(e.target.value)}
                            style={{
                              width: 78,
                              padding: "4px 8px",
                              fontSize: 13,
                              background: "var(--worker-control-bg)",
                              border: "1px solid var(--worker-control-border)",
                              borderRadius: 5,
                              color: "var(--worker-ink)",
                            }} />
                        </td>
                      ) :
                        <td
                          style={{
                            padding: "8px 16px",
                            color: "var(--worker-ink)",
                            textAlign: "center",
                          }}
                        >
                          {d.fecha_inicio ? d.fecha_inicio.toString().split('T')[0] : "-"}
                        </td>
                    }

                    {/* End date */
                      isEditing ? (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}>
                          <input
                            type="date"
                            value={editFechaFin}
                            onChange={(e) => setEditFechaFin(e.target.value)}
                            style={{
                              width: 86,
                              padding: "4px 8px",
                              fontSize: 13,
                              background: "var(--worker-control-bg)",
                              border: "1px solid var(--worker-control-border)",
                              borderRadius: 5,
                              color: "var(--worker-ink)",
                            }} />
                        </td>
                      ) : (
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}>
                          {d.fecha_fin ? d.fecha_fin.toString().split('T')[0] : "-"}
                        </td>
                      )}

                    {/* Active */}
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}>
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
                            backgroundColor: d.activo
                              ? "var(--worker-inventory-bg)"
                              : "var(--worker-bench)",
                            color: d.activo
                              ? "var(--worker-inventory-fg)"
                              : "var(--worker-ink-muted)",
                            border: d.activo
                              ? "1px solid var(--worker-inventory-border)"
                              : "1px solid var(--worker-border)",
                          }}
                        >
                          {d.activo ? "Sí" : "No"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}>
                      {isEditing ? (
                        <div style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "center",
                        }}>
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
                          disabled={savingEdit}
                          onClick={() => startEdit(d)}
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
              ¿Guardar los cambios para este descuento?
            </WorkerDialogDescription>
          </WorkerDialogHeader>
          <WorkerDialogBody>
            {pendingEdit && (
              <div style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                <p style={{ margin: "0 0 4px" }}>
                  <strong style={{ color: "var(--worker-ink)" }}>Descuento:</strong>{" "}
                  {pendingEdit.nombre} ({pendingEdit.porcentaje}%)
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

      {/* ── Create Discount Modal ── */}
      {createOpen && (
        <WorkerCreateDiscountModal
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {/* ── Apply Discount Modal ── */}
      {applyModalOpen && (
        <WorkerApplyDiscountModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          tipoDescuento={applyModalType}
        />
      )}

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

    </div>
  )
}