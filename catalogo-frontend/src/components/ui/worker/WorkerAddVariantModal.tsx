import { useState } from "react";
import { useWorkerProducto, useCrearVariante, useSubirImagen } from "../../../queries/workerProducts";
import type { WorkerColor, WorkerProductoSlim, WorkerCategoria } from "../../../services/worker";
import type { WorkerProducto } from "../../../types/worker";
import { IMAGE_PLACEHOLDER_URL, resolveImageUrl } from "../../../utils/images";
import {
  WorkerDialogRoot,
  WorkerDialogContent,
  WorkerDialogHeader,
  WorkerDialogTitle,
  WorkerDialogDescription,
  WorkerDialogBody,
  WorkerDialogFooter,
} from "./WorkerDialog";
import {
  SelectProductSection,
  AddVariantSection,
  SectionCard,
  InlineNotice,
  ModalButton,
  variantePendingCopy,
  ADD_VARIANT_FORM_ID,
} from "./WorkerCreateProductModal";

// ─── AddVariantModalMode ──────────────────────────────────────────────────────
export type AddVariantModalMode = "select-product" | "add-variant" | "success";

// ─── BaseProductInfoPreview ───────────────────────────────────────────────────
function BaseProductInfoPreview({ productId, categorias }: { productId: number, categorias: WorkerCategoria[] }) {
  const [open, setOpen] = useState(false);
  const { data: producto, isLoading, error } = useWorkerProducto(productId);

  return (
    <div
      style={{
        border: "1px solid var(--worker-border-soft)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: open ? "var(--worker-overlay)" : "var(--worker-bench)",
          border: "none",
          borderBottom: open ? "1px solid var(--worker-border-soft)" : "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--worker-ink)" }}>
          Información del producto base
        </span>
        <span style={{ fontSize: 18, color: "var(--worker-ink-secondary)", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div style={{ padding: 16, background: "var(--worker-bench)", display: "flex", gap: 16 }}>
          {isLoading && <p style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}>Cargando información...</p>}
          {error && <p style={{ fontSize: 13, color: "var(--worker-destructive)" }}>Error al cargar producto.</p>}
          {producto && (
            <>
              <img
                src={resolveImageUrl(producto.imagen) || IMAGE_PLACEHOLDER_URL}
                alt={producto.nombre}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid var(--worker-border-soft)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--worker-ink)" }}>
                    {producto.nombre}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                    ${Number(producto.precio).toLocaleString()} • {categorias.find(c => c.id === producto.categoria)?.nombre || "Sin categoría"}
                  </p>
                </div>
                {producto.descripcion && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--worker-ink-secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {producto.descripcion}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--worker-ink-tertiary)",
                      background: "var(--worker-overlay)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Peso: {producto.peso}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WorkerAddVariantModal ────────────────────────────────────────────────────
export type WorkerAddVariantModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: WorkerCategoria[];
  colores: WorkerColor[];
  productos: WorkerProductoSlim[];
  isLoadingProductos?: boolean;
  errorProductos?: string | null;
  onRetryProductos?: () => void;
};

export function WorkerAddVariantModal({
  open,
  onOpenChange,
  categorias,
  colores,
  productos,
  isLoadingProductos,
  errorProductos,
  onRetryProductos,
}: WorkerAddVariantModalProps) {
  const [mode, setMode] = useState<AddVariantModalMode>("select-product");
  const [selectedProduct, setSelectedProduct] = useState<WorkerProductoSlim | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  const crearVarianteM = useCrearVariante();
  const subirImagenM = useSubirImagen();

  const isPending = crearVarianteM.isPending || subirImagenM.isPending;

  const resetFlow = () => {
    setMode("select-product");
    setSelectedProduct(null);
    setAddedCount(0);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    if (!nextOpen) resetFlow();
    onOpenChange(nextOpen);
  };

  const handleCloseClick = () => {
    if (isPending) return;
    resetFlow();
    onOpenChange(false);
  };

  const handleAddAnother = () => {
    setMode("add-variant");
  };

  const modalTitles: Record<AddVariantModalMode, string> = {
    "select-product": "Elegir producto",
    "add-variant": "Nueva variante",
    "success": "Variante guardada",
  };

  const modalDescriptions: Record<AddVariantModalMode, string> = {
    "select-product": "Buscá un producto existente para agregarle una nueva variante de color o SKU.",
    "add-variant": `Cargá los datos de la variante para "${selectedProduct?.nombre ?? ""}".`,
    "success": `La variante fue asociada correctamente a "${selectedProduct?.nombre ?? ""}".`,
  };

  return (
    <WorkerDialogRoot open={open} onOpenChange={handleOpenChange}>
      <WorkerDialogContent size="lg" layout="adaptive" className="worker-create-dialog">
        <WorkerDialogHeader>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <WorkerDialogTitle>{modalTitles[mode]}</WorkerDialogTitle>
              <WorkerDialogDescription>{modalDescriptions[mode]}</WorkerDialogDescription>
            </div>

            <button
              type="button"
              onClick={handleCloseClick}
              disabled={isPending}
              aria-label="Cerrar modal"
              style={{
                background: "none",
                border: "1px solid var(--worker-border-soft)",
                fontSize: 20,
                lineHeight: 1,
                color: isPending
                  ? "var(--worker-ink-muted)"
                  : "var(--worker-ink-tertiary)",
                cursor: isPending ? "not-allowed" : "pointer",
                padding: "6px 10px",
                borderRadius: 10,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </WorkerDialogHeader>

        <WorkerDialogBody scrollable>
          {mode === "select-product" && (
            <SelectProductSection
              productos={productos}
              loading={isLoadingProductos}
              error={errorProductos}
              onRetry={onRetryProductos}
              onSelected={(p) => {
                setSelectedProduct(p);
                setMode("add-variant");
              }}
            />
          )}

          {mode === "add-variant" && selectedProduct && (
            <>
              <BaseProductInfoPreview productId={selectedProduct.id} categorias={categorias} />
              <AddVariantSection
                createdProduct={selectedProduct as unknown as WorkerProducto}
                colores={colores}
                varianteMutation={crearVarianteM}
                imagenMutation={subirImagenM}
                onCompleted={() => {
                  setAddedCount((n) => n + 1);
                  setMode("success");
                }}
              />
            </>
          )}

          {mode === "success" && selectedProduct && (
            <AddVariantSuccessSection
              productName={selectedProduct.nombre}
              addedCount={addedCount}
            />
          )}
        </WorkerDialogBody>

        <WorkerDialogFooter className="worker-dialog-footer--stack-sm">
          {mode === "select-product" && (
            <ModalButton kind="secondary" onClick={handleCloseClick}>
              Cancelar
            </ModalButton>
          )}

          {mode === "add-variant" && (
            <>
              <ModalButton
                kind="secondary"
                onClick={() => setMode("select-product")}
                disabled={isPending}
              >
                Volver
              </ModalButton>
              <ModalButton
                kind="primary"
                type="submit"
                form={ADD_VARIANT_FORM_ID}
                disabled={isPending}
              >
                {variantePendingCopy(crearVarianteM.isPending, subirImagenM.isPending)}
              </ModalButton>
            </>
          )}

          {mode === "success" && (
            <>
              <ModalButton kind="secondary" onClick={handleCloseClick}>
                Cerrar
              </ModalButton>
              <ModalButton kind="primary" onClick={handleAddAnother}>
                Agregar otra variante
              </ModalButton>
            </>
          )}
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}

// ─── AddVariantSuccessSection ─────────────────────────────────────────────────
function AddVariantSuccessSection({
  productName,
  addedCount,
}: {
  productName: string;
  addedCount: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InlineNotice tone="success">
        {addedCount === 1
          ? <>Primera variante agregada a <strong>{productName}</strong>.</>
          : <>{addedCount} variantes agregadas a <strong>{productName}</strong>.</>}
      </InlineNotice>

      <SectionCard
        title="¿Qué sigue?"
        description="Podés continuar agregando variantes al mismo producto o cerrar el panel."
      >
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            color: "var(--worker-ink-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <li>
            Hacé clic en <strong>Agregar otra variante</strong> para cargar una combinación de color o SKU diferente.
          </li>
          <li>
            Hacé clic en <strong>Cerrar</strong> para volver al listado. Las variantes se actualizarán automáticamente.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
