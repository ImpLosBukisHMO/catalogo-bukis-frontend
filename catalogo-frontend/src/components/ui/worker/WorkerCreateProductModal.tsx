import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent, ReactNode } from "react";
import type { AxiosError } from "axios";
import {
  useCrearProducto,
  useCrearVariante,
  useSubirImagen,
  useEditarProducto,
  useEditarVariante,
} from "../../../queries/workerProducts";
import type {
  WorkerCategoria,
  WorkerColor,
  WorkerProductoSlim,
} from "../../../services/worker";
import type { WorkerCreatedVariant } from "../../../services/worker";
import type { WorkerProducto, WorkerVariant } from "../../../types/worker";
import {
  WorkerDialogBody,
  WorkerDialogContent,
  WorkerDialogDescription,
  WorkerDialogFooter,
  WorkerDialogHeader,
  WorkerDialogRoot,
  WorkerDialogTitle,
} from "./WorkerDialog";
import {
  buildPublishReadinessIssues,
  getProductPublicationLabel,
  hasVariantDraftData,
} from "./workerProductFlow";
import Barcode from "react-barcode";
import { useWorkerTheme } from "../../providers/useWorkerTheme";

export type ModalMode = "create-product" | "success" | "add-variant" | "select-product" | "edit-base-product" | "select-variant-to-edit" | "edit-variant";

export type WorkerCreateProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: WorkerCategoria[];
  colores: WorkerColor[];
  productos: WorkerProductoSlim[];
  isLoadingProductos?: boolean;
  errorProductos?: string | null;
  onRetryProductos?: () => void;
  editingProduct?: WorkerProducto | null;
  onEditingFinished?: () => void;
  initialVariantId?: number | null;
  initialVariant?: WorkerVariant | null;
};

type ProductFormState = {
  nombre: string;
  precio: string;
  peso: string;
  medidas: string;
  descripcion: string;
  capacidad: string;
  categorias_ids: string[];
};

type ProductFieldErrors = Partial<Record<keyof ProductFormState | "imagen", string>>;

type VariantFieldErrors = Partial<Record<"colorId" | "item" | "stock" | "codigo_barras", string>>;
type EditVariantFieldErrors = Partial<Record<"colorId" | "item" | "stock" | "precio", string>>;

type PendingVariantUpload = {
  variant: WorkerCreatedVariant;
  requestKey: string;
  nextImageIndex: number;
};

type PartialUnifiedCreateState = {
  product: WorkerProducto;
  variant: WorkerCreatedVariant | null;
  failedStep: "variant" | "images" | "publish";
};

type ApiErrorPayload = {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
};

type WorkerPhotoPickerProps =
  | {
    mode: "product";
    label: string;
    helper: string;
    error?: string;
    value: File | null;
    onChange: (value: File | null) => void;
  }
  | {
    mode: "variant";
    label: string;
    helper: string;
    error?: string;
    value: File[];
    onChange: (value: File[]) => void;
  };

const CREATE_PRODUCT_FORM_ID = "worker-create-product-form";
const ADD_VARIANT_FORM_ID = "worker-add-variant-form";
const EDIT_VARIANT_FORM_ID = "worker-edit-variant-form";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  fontSize: 14,
  background: "var(--worker-control-bg)",
  border: "1px solid var(--worker-control-border)",
  borderRadius: 10,
  color: "var(--worker-ink)",
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--worker-ink-secondary)",
  fontWeight: 600,
  letterSpacing: "0.01em",
};

const helperStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--worker-ink-tertiary)",
  lineHeight: 1.5,
};

const errorStyle: CSSProperties = {
  color: "var(--worker-error-fg)",
  fontSize: 12,
  margin: 0,
  lineHeight: 1.5,
};

const successStyle: CSSProperties = {
  color: "var(--worker-inventory-fg)",
  fontSize: 12,
  margin: 0,
  lineHeight: 1.5,
};

const defaultProductForm: ProductFormState = {
  nombre: "",
  precio: "",
  peso: "",
  medidas: "",
  descripcion: "",
  capacidad: "",
  categorias_ids: [],
};

const sectionCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  borderRadius: 14,
  background: "var(--worker-shelf)",
  border: "1px solid var(--worker-border-soft)",
};

const responsiveGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

export function WorkerCreateProductModal({
  open,
  onOpenChange,
  categorias,
  colores,
  productos,
  isLoadingProductos,
  errorProductos,
  onRetryProductos,
  editingProduct,
  onEditingFinished,
  initialVariantId,
  initialVariant,
}: WorkerCreateProductModalProps) {

  const [mode, setMode] = useState<ModalMode>(() => {
    if (editingProduct) {
      return initialVariantId ? "edit-variant" : "success";
    }
    return "create-product";
  });

  const [createdProduct, setCreatedProduct] = useState<WorkerProducto | null>(
    editingProduct ?? null
  );

  const [selectedVariantToEdit, setSelectedVariantToEdit] = useState<WorkerVariant | null>(() => {
    if (initialVariant) {
      return initialVariant;
    }
    if (editingProduct && initialVariantId) {
      return editingProduct.variantes?.find(v => v.variant_id === initialVariantId) ?? null;
    }
    return null;
  });

  const crearProductoM = useCrearProducto();
  const editarProductoM = useEditarProducto();
  const crearVarianteM = useCrearVariante();
  const subirImagenM = useSubirImagen();
  const editarVarianteM = useEditarVariante();

  const isPending =
    crearProductoM.isPending || editarProductoM.isPending || crearVarianteM.isPending || subirImagenM.isPending || editarVarianteM.isPending;

  const resetFlow = () => {
    setMode("create-product");
    setCreatedProduct(null);
    setSelectedVariantToEdit(null);
    onEditingFinished?.();
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

  const createdProductLabel = createdProduct?.nombre
    ?? productos.find((producto) => producto.id === createdProduct?.id)?.nombre
    ?? "";

  if (open && initialVariantId && !editingProduct) return null

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
              <WorkerDialogTitle>
                {mode === "create-product" && "Nuevo producto"}
                {mode === "edit-base-product" && "Editar información general"}
                {mode === "select-product" && "Elegir producto"}
                {mode === "success" && (editingProduct ? "Gestionar producto" : "Producto guardado")}
                {mode === "add-variant" && "Agregar variante"}
                {mode === "select-variant-to-edit" && "Seleccionar variante"}
                {mode === "edit-variant" && "Editar variante"}
              </WorkerDialogTitle>
              <WorkerDialogDescription>
                {mode === "create-product" && "Completá la información general, la primera variante y la publicación en un solo flujo."}
                {mode === "edit-base-product" && "Modificá los datos generales del producto."}
                {mode === "select-product" && "Buscá un producto existente para seguir con sus variantes."}
                {mode === "success" && "Revisá el resumen y seguí gestionando variantes cuando lo necesites."}
                {mode === "add-variant" && "Cargá una nueva combinación de color, SKU, stock y fotos."}
                {mode === "select-variant-to-edit" && "Elegí qué variante quieres modificar."}
                {mode === "edit-variant" && "Actualizá stock, precio o fotos de la variante."}
              </WorkerDialogDescription>
            </div>

            {mode === "edit-variant" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -4 }}>
                <button
                  type="button"
                  onClick={() => setMode("edit-base-product")}
                  style={{
                    ...tertiaryButtonStyle(),
                    borderColor: "var(--worker-rail)",
                    color: "var(--worker-rail)",
                  }}
                >
                  Editar información general
                </button>
              </div>
            )}

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
          {(mode === "create-product" || mode === "edit-base-product") && (
            mode === "create-product" ? (
              <UnifiedCreateProductSection
                categorias={categorias}
                colores={colores}
                crearProductoM={crearProductoM}
                editarProductoM={editarProductoM}
                crearVarianteM={crearVarianteM}
                subirImagenM={subirImagenM}
                onAbortAfterPartialCreate={handleCloseClick}
                onCreated={(product) => {
                  setCreatedProduct(product);
                  setMode("success");
                }}
              />
            ) : (
              <CreateProductSection
                categorias={categorias}
                onSave={async (data) => {
                  if (createdProduct) {
                    return (await editarProductoM.mutateAsync({ productId: createdProduct.id, data })) as WorkerProducto;
                  }
                  return (await crearProductoM.mutateAsync(data)) as WorkerProducto;
                }}
                initialProduct={createdProduct}
                productos={productos}
                onCreated={(product) => {
                  setCreatedProduct(product);
                  setMode("success");
                }}
                onSwitchToExisting={() => setMode("select-product")}
                isEditing={mode === "edit-base-product"}
              />
            )
          )}

          {mode === "select-product" && (
            <SelectProductSection
              productos={productos}
              loading={isLoadingProductos}
              error={errorProductos}
              onRetry={onRetryProductos}
              onSelected={(p) => {
                setCreatedProduct(p as unknown as WorkerProducto);
                setMode("add-variant");
              }}
            />
          )}

          {mode === "success" && createdProduct && (
            <SuccessSection
              createdProduct={createdProduct}
              createdProductLabel={createdProductLabel}
              onEditBase={() => setMode("edit-base-product")}
              onAddVariant={() => setMode("add-variant")}
              onManageVariants={() => setMode("select-variant-to-edit")}
            />
          )}

          {mode === "add-variant" && createdProduct && (
            <AddVariantSection
              createdProduct={createdProduct}
              colores={colores}
              varianteMutation={crearVarianteM}
              imagenMutation={subirImagenM}
              onCompleted={() => setMode("success")}
            />
          )}

          {mode === "select-variant-to-edit" && createdProduct && (
            <SelectVariantToEditSection
              product={createdProduct}
              onVariantSelected={(variant) => {
                setSelectedVariantToEdit(variant);
                setMode("edit-variant");
              }}
            />
          )}

          {mode === "edit-variant" && createdProduct && selectedVariantToEdit && (
            <EditVariantSection
              product={createdProduct}
              variant={selectedVariantToEdit}
              colores={colores}
              varianteMutation={editarVarianteM}
              imagenMutation={subirImagenM}
              onCompleted={handleCloseClick}
            />
          )}
        </WorkerDialogBody>

        <WorkerDialogFooter className="worker-dialog-footer--stack-sm">
          {mode === "edit-base-product" && (
            <>
              <ModalButton kind="secondary" onClick={handleCloseClick} disabled={isPending}>
                Cancelar
              </ModalButton>
              <ModalButton
                kind="primary"
                type="submit"
                form={CREATE_PRODUCT_FORM_ID}
                disabled={isPending}
              >
                {isPending ? "Guardando…" : (mode === "edit-base-product" ? "Guardar cambios" : "Crear producto")}
              </ModalButton>
            </>
          )}

          {mode === "select-product" && (
            <>
              <ModalButton kind="secondary" onClick={() => setMode("create-product")}>
                Crear producto nuevo
              </ModalButton>
            </>
          )}

          {mode === "success" && (
            <>
              <ModalButton kind="secondary" onClick={handleCloseClick}>
                Cerrar
              </ModalButton>
              <ModalButton kind="primary" onClick={() => setMode("add-variant")}>
                Agregar variante
              </ModalButton>
            </>
          )}

          {mode === "add-variant" && (
            <>
              <ModalButton
                kind="secondary"
                onClick={() => setMode("success")}
                disabled={isPending}
              >
                Volver al resumen
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

          {(mode === "select-variant-to-edit" || mode === "edit-variant") && (
            <>
              <ModalButton
                kind="secondary"
                onClick={() => mode === "edit-variant" ? handleCloseClick() : setMode("success")}
                disabled={isPending}
              >
                Cancelar
              </ModalButton>
              {mode === "edit-variant" && (
                <ModalButton
                  kind="primary"
                  type="submit"
                  form={EDIT_VARIANT_FORM_ID}
                  disabled={isPending}
                >
                  {isPending ? "Guardando…" : "Actualizar variante"}
                </ModalButton>
              )}
            </>
          )}
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}

function UnifiedCreateProductSection({
  categorias,
  colores,
  crearProductoM,
  editarProductoM,
  crearVarianteM,
  subirImagenM,
  onAbortAfterPartialCreate,
  onCreated,
}: {
  categorias: WorkerCategoria[];
  colores: WorkerColor[];
  crearProductoM: ReturnType<typeof useCrearProducto>;
  editarProductoM: ReturnType<typeof useEditarProducto>;
  crearVarianteM: ReturnType<typeof useCrearVariante>;
  subirImagenM: ReturnType<typeof useSubirImagen>;
  onAbortAfterPartialCreate: () => void;
  onCreated: (product: WorkerProducto) => void;
}) {
  const [step, setStep] = useState<"general" | "variant" | "publication">("general");
  const [form, setForm] = useState<ProductFormState>(defaultProductForm);
  const [imagen, setImagen] = useState<File | null>(null);
  const [colorId, setColorId] = useState("");
  const [item, setItem] = useState("");
  const [stock, setStock] = useState("");
  const [activo, setActivo] = useState(true);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [esPrincipal, setEsPrincipal] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [variantErrors, setVariantErrors] = useState<VariantFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [partialCreationState, setPartialCreationState] = useState<PartialUnifiedCreateState | null>(null);
  const submitInFlightRef = useRef(false);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const isPending =
    crearProductoM.isPending
    || editarProductoM.isPending
    || crearVarianteM.isPending
    || subirImagenM.isPending;
  const isSubmissionPending = isPending || isSubmitLocked;

  const variantDraftStarted = hasVariantDraftData({
    colorId,
    item,
    stock,
    activo,
    imagesCount: imagenes.length,
  });

  const publishIssues = useMemo(() => buildPublishReadinessIssues({
    product: {
      precio: form.precio,
      categorias_ids: form.categorias_ids,
    },
    variant: {
      colorId,
      item,
      stock,
      activo,
      imagesCount: imagenes.length,
    },
  }), [activo, colorId, form.categorias_ids, form.precio, imagenes.length, item, stock]);

  const setField = (key: keyof ProductFormState) => (value: string | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateGeneralStep = () => {
    const nextFieldErrors: ProductFieldErrors = {};

    if (!form.nombre.trim()) nextFieldErrors.nombre = "Ingresá el nombre.";
    if (!form.precio.trim()) nextFieldErrors.precio = "Ingresá el precio.";
    if (!form.peso.trim()) nextFieldErrors.peso = "Ingresá el peso.";
    if (!form.medidas.trim()) nextFieldErrors.medidas = "Ingresá las medidas.";
    if (!form.descripcion.trim()) nextFieldErrors.descripcion = "Ingresá la descripción.";
    if (!imagen) nextFieldErrors.imagen = "Seleccioná una imagen principal.";

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  };

  const validateVariantForDraft = () => {
    if (!variantDraftStarted) {
      setVariantErrors({});
      return true;
    }

    const nextErrors: VariantFieldErrors = {};
    if (!colorId.trim()) nextErrors.colorId = "Seleccioná un color.";
    if (!item.trim()) nextErrors.item = "Ingresá el SKU de la variante.";
    if (!stock.trim()) nextErrors.stock = "Ingresá el stock de la variante.";

    setVariantErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadVariantImages = async (productoId: number, variantId: number) => {
    for (let index = 0; index < imagenes.length; index += 1) {
      const formData = new FormData();
      formData.append("imagen", imagenes[index]);
      formData.append("orden", String(index));
      formData.append("es_principal", index === 0 && esPrincipal ? "true" : "false");
      formData.append("variante", String(variantId));
      await subirImagenM.mutateAsync({ productoId, data: formData });
    }
  };

  const buildProductFormData = (estado: "draft" | "active") => {
    const formData = new FormData();
    formData.append("nombre", form.nombre.trim());
    formData.append("precio", form.precio);
    formData.append("peso", form.peso);
    formData.append("medidas", form.medidas.trim());
    formData.append("descripcion", form.descripcion.trim());
    formData.append("disponible", estado === "active" ? "true" : "false");
    formData.append("estado", estado);
    if (form.capacidad.trim()) formData.append("capacidad", form.capacidad.trim());
    form.categorias_ids.forEach((id) => formData.append("categorias_ids", id));
    if (imagen) formData.append("imagen", imagen);
    return formData;
  };

  const handleSave = async (intent: "draft" | "publish") => {
    if (partialCreationState) {
      setSubmitError(buildPartialUnifiedCreateMessage(partialCreationState));
      return;
    }

    if (submitInFlightRef.current || isPending) {
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitLocked(true);

    setSubmitError("");
    let createdProduct: WorkerProducto | null = null;
    let createdVariant: WorkerCreatedVariant | null = null;
    let failedStep: PartialUnifiedCreateState["failedStep"] = "variant";

    try {
      const generalValid = validateGeneralStep();
      const variantValid = validateVariantForDraft();

      if (!generalValid) {
        setStep("general");
        return;
      }

      if (!variantValid) {
        setStep("variant");
        return;
      }

      if (intent === "publish" && publishIssues.length > 0) {
        setFieldErrors((current) => ({
          ...current,
          categorias_ids: form.categorias_ids.length === 0
            ? "Seleccioná al menos una categoría para publicar."
            : current.categorias_ids,
        }));
        setVariantErrors((current) => ({
          ...current,
          colorId: !colorId.trim() ? "Seleccioná un color." : current.colorId,
          item: !item.trim() ? "Ingresá el SKU de la variante." : current.item,
          stock: !stock.trim() ? "Ingresá el stock de la variante." : current.stock,
        }));
        setStep("publication");
        return;
      }

      createdProduct = await crearProductoM.mutateAsync(buildProductFormData("draft")) as WorkerProducto;

      if (variantDraftStarted) {
        failedStep = "variant";
        createdVariant = await crearVarianteM.mutateAsync({
          productoId: createdProduct.id,
          data: {
            color: Number(colorId),
            stock: Number(stock),
            activo,
            item: item.trim(),
          },
        }) as WorkerCreatedVariant;

        if (imagenes.length > 0) {
          failedStep = "images";
          await uploadVariantImages(createdProduct.id, createdVariant.id);
        }
      }

      if (intent === "publish") {
        failedStep = "publish";
        const publishedProduct = await editarProductoM.mutateAsync({
          productId: createdProduct.id,
          data: buildProductFormData("active"),
        }) as WorkerProducto;
        setPartialCreationState(null);
        onCreated(publishedProduct);
        return;
      }

      setPartialCreationState(null);
      onCreated(createdProduct);
    } catch (error) {
      if (createdProduct) {
        const nextPartialState: PartialUnifiedCreateState = {
          product: createdProduct,
          variant: createdVariant,
          failedStep,
        };

        setPartialCreationState(nextPartialState);
        setSubmitError(buildPartialUnifiedCreateMessage(nextPartialState));
        return;
      }

      const parsed = parseProductApiError(error);
      setFieldErrors((current) => ({ ...current, ...parsed.fieldErrors }));
      setSubmitError(parsed.submitError || parseInlineApiError(error));
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitLocked(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard
        title="Progreso"
        description="Guiamos la creación en tres pasos para que el producto se sienta completo antes de publicarlo."
      >
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {[
            { key: "general", label: "1. Información general" },
            { key: "variant", label: "2. Primera variante" },
            { key: "publication", label: "3. Publicación" },
          ].map((stepItem, index) => {
            const stepOrder = ["general", "variant", "publication"];
            const isCurrent = stepItem.key === step;
            const isDone = stepOrder.indexOf(step) > index;
            return (
              <button
                key={stepItem.key}
                type="button"
                onClick={() => setStep(stepItem.key as "general" | "variant" | "publication")}
                style={{
                  ...secondaryButtonStyle(false),
                  justifyContent: "flex-start",
                  textAlign: "left",
                  borderColor: isCurrent ? "var(--worker-rail)" : "var(--worker-border)",
                  background: isCurrent ? "var(--worker-overlay)" : "var(--worker-bench)",
                  color: isCurrent ? "var(--worker-rail)" : "var(--worker-ink-secondary)",
                  fontWeight: isCurrent || isDone ? 700 : 600,
                }}
              >
                {isDone ? "✓ " : ""}
                {stepItem.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {step === "general" && (
        <>
          <SectionCard
            title="Información general"
            description="Completá los datos compartidos del producto. La categoría ayuda a publicar, pero no bloquea guardar el borrador."
          >
            <div style={responsiveGridStyle}>
              <FormField label="Nombre" error={fieldErrors.nombre}>
                <input autoFocus type="text" value={form.nombre} onChange={(event) => setField("nombre")(event.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Precio" error={fieldErrors.precio}>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.precio} onChange={(event) => setField("precio")(event.target.value)} style={inputStyle} />
              </FormField>
            </div>

            <div style={responsiveGridStyle}>
              <FormField label="Peso" error={fieldErrors.peso}>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.peso} onChange={(event) => setField("peso")(event.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Medidas" error={fieldErrors.medidas}>
                <input type="text" value={form.medidas} onChange={(event) => setField("medidas")(event.target.value)} style={inputStyle} />
              </FormField>
            </div>

            <div style={responsiveGridStyle}>
              <FormField label="Capacidad" error={fieldErrors.capacidad} required={false}>
                <input type="text" value={form.capacidad} onChange={(event) => setField("capacidad")(event.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Categorías" error={fieldErrors.categorias_ids} required={false}>
                <div style={{ ...inputStyle, maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px" }}>
                  {categorias.length === 0 ? (
                    <span style={{ color: "var(--worker-ink-tertiary)", fontSize: 13 }}>No hay categorías disponibles</span>
                  ) : categorias.map((categoria) => {
                    const isChecked = form.categorias_ids.includes(String(categoria.id));
                    return (
                      <label key={categoria.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--worker-ink-secondary)" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            const categoryId = String(categoria.id);
                            const shouldInclude = event.target.checked;
                            setForm((current) => ({
                              ...current,
                              categorias_ids: shouldInclude
                                ? current.categorias_ids.includes(categoryId)
                                  ? current.categorias_ids
                                  : [...current.categorias_ids, categoryId]
                                : current.categorias_ids.filter((id) => id !== categoryId),
                            }));
                            setFieldErrors((current) => ({ ...current, categorias_ids: undefined }));
                          }}
                        />
                        {categoria.nombre}
                      </label>
                    );
                  })}
                </div>
              </FormField>
            </div>

            <FormField label="Descripción" error={fieldErrors.descripcion}>
              <textarea value={form.descripcion} onChange={(event) => setField("descripcion")(event.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} />
            </FormField>
          </SectionCard>

          <SectionCard
            title="Imagen principal del producto"
            description="La usamos como referencia general. Las imágenes por color se cargan en la primera variante."
          >
            <WorkerPhotoPicker
              mode="product"
              label="Foto principal"
              helper="Podés sacar la foto en el momento o elegirla desde la galería."
              error={fieldErrors.imagen}
              value={imagen}
              onChange={(nextImage) => {
                setImagen(nextImage);
                setFieldErrors((current) => ({ ...current, imagen: undefined }));
              }}
            />
          </SectionCard>
        </>
      )}

      {step === "variant" && (
        <>
          <SectionCard
            title="Primera variante"
            description="Este paso es opcional si solo querés guardar un borrador. Para publicar sí necesitás completar color, SKU, stock e imágenes."
          >
            <InlineNotice tone="info" style={{ marginBottom: 12 }}>
              Si todavía no tenés la variante lista, podés seguir y guardar el producto como borrador.
            </InlineNotice>

            <FormField label="Color" error={variantErrors.colorId} required={false}>
              <select
                autoFocus
                value={colorId}
                onChange={(event) => {
                  setColorId(event.target.value);
                  setVariantErrors((current) => ({ ...current, colorId: undefined }));
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Seleccioná un color</option>
                {colores.map((color) => (
                  <option key={color.id} value={String(color.id)}>
                    {color.nombre} ({color.hex})
                  </option>
                ))}
              </select>
            </FormField>

            <div style={responsiveGridStyle}>
              <FormField label="SKU" error={variantErrors.item} required={false}>
                <input type="text" value={item} onChange={(event) => {
                  setItem(event.target.value);
                  setVariantErrors((current) => ({ ...current, item: undefined }));
                }} style={inputStyle} />
              </FormField>
              <FormField label="Stock" error={variantErrors.stock} required={false}>
                <input type="number" min="0" inputMode="numeric" value={stock} onChange={(event) => {
                  setStock(event.target.value);
                  setVariantErrors((current) => ({ ...current, stock: undefined }));
                }} style={inputStyle} />
              </FormField>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--worker-ink-secondary)" }}>
              <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} />
              {activo ? "La variante quedará activa cuando publiques el producto." : "La variante quedará inactiva hasta que la actives."}
            </label>
          </SectionCard>

          <SectionCard
            title="Fotos de la variante"
            description="Estas imágenes sí cuentan para la publicación porque representan el color específico."
          >
            <WorkerPhotoPicker
              mode="variant"
              label="Fotos de la primera variante"
              helper="Podés agregar una foto desde cámara o varias desde la galería."
              value={imagenes}
              onChange={setImagenes}
            />

            {imagenes.length > 0 && (
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--worker-ink-secondary)" }}>
                <input type="checkbox" checked={esPrincipal} onChange={(event) => setEsPrincipal(event.target.checked)} />
                Marcar la primera foto como principal de la variante
              </label>
            )}
          </SectionCard>
        </>
      )}

      {step === "publication" && (
        <>
          <SectionCard
            title="Publicación"
            description="Podés guardar como borrador aunque falte la variante. Para publicar, te mostramos exactamente qué falta."
          >
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <SummaryItem label="Nombre" value={form.nombre || "—"} />
              <SummaryItem label="Categorías" value={form.categorias_ids.length > 0 ? `${form.categorias_ids.length} seleccionada(s)` : "Sin categorías"} />
              <SummaryItem label="Primera variante" value={variantDraftStarted ? "Capturada para revisión" : "Todavía no agregada"} />
              <SummaryItem label="Publicación" value={publishIssues.length === 0 ? "Lista para publicar" : "Guardar como borrador"} />
            </div>
          </SectionCard>

          {publishIssues.length === 0 ? (
            <InlineNotice tone="success">
              Todo listo: el producto cumple con los requisitos para publicar.
            </InlineNotice>
          ) : (
            <SectionCard
              title="Requisitos para publicar"
              description="Estas señales ayudan a corregir el flujo antes de depender de la validación final del backend."
            >
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, color: "var(--worker-error-fg)" }}>
                {publishIssues.map((issue) => (
                  <li key={issue.code} style={{ fontSize: 14, lineHeight: 1.5 }}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}

      {submitError && <InlineNotice tone="error">{submitError}</InlineNotice>}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <ModalButton kind="secondary" onClick={() => {
          if (step === "general") return;
          setStep(step === "publication" ? "variant" : "general");
        }} disabled={isSubmissionPending || step === "general" || partialCreationState !== null}>
          Atrás
        </ModalButton>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {step !== "publication" ? (
              <ModalButton kind="primary" onClick={() => {
                if (step === "general") {
                  if (validateGeneralStep()) {
                    setSubmitError("");
                    setStep("variant");
                  }
                  return;
                }
                setSubmitError("");
                setStep("publication");
              }} disabled={isSubmissionPending}>
                {step === "general" ? "Continuar a la variante" : "Continuar a publicación"}
              </ModalButton>
          ) : (
            <>
              {partialCreationState ? (
                <ModalButton kind="primary" onClick={onAbortAfterPartialCreate}>
                  Cerrar para evitar duplicados
                </ModalButton>
              ) : (
                <>
                  <ModalButton kind="secondary" onClick={() => void handleSave("draft")} disabled={isSubmissionPending}>
                    {isSubmissionPending ? "Guardando…" : "Guardar borrador"}
                  </ModalButton>
                  <ModalButton kind="primary" onClick={() => void handleSave("publish")} disabled={isSubmissionPending}>
                    {isSubmissionPending ? "Publicando…" : "Publicar producto"}
                  </ModalButton>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Intent: a worker often uses this flow while standing with a phone and product in hand.
 * Palette: paper/shelf/rail worker tokens keep the warm workshop feel already established.
 * Depth: borders + quiet layered surfaces keep sections readable without noisy shadows.
 * Surfaces: canvas -> shelf card -> control backgrounds preserve subtle elevation.
 * Typography: compact, medium-weight labels and strong titles prioritize scanning speed.
 * Spacing: 4px base expanded into 8/12/16px groups for thumb-friendly rhythm.
 */
function CreateProductSection({
  categorias,
  onSave,
  initialProduct,
  onCreated,
  onSwitchToExisting,
  isEditing,
}: {
  categorias: WorkerCategoria[];
  onSave: (data: FormData) => Promise<WorkerProducto>;
  initialProduct?: WorkerProducto | null;
  productos?: WorkerProductoSlim[];
  onCreated: (product: WorkerProducto) => void;
  onSwitchToExisting: () => void;
  isEditing?: boolean;
}) {
  const [form, setForm] = useState<ProductFormState>(() => {
    if (initialProduct) {
      const p = initialProduct as WorkerProducto;

      return {
        nombre: String(p.nombre || ""),
        precio: p.precio !== undefined ? String(p.precio) : "",
        peso: p.peso !== undefined ? String(p.peso) : "",
        medidas: String(p.medidas || ""),
        descripcion: String(p.descripcion || ""),
        capacidad: String(p.capacidad || ""),
        categorias_ids: Array.isArray(p.categorias) ? p.categorias.map(String) : [],
      };
    }
    return defaultProductForm;
  });

  const [imagen, setImagen] = useState<File | null>(null);
  const [disponible, setDisponible] = useState(initialProduct?.disponible ?? false);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const setField = (key: keyof ProductFormState) => (value: string | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextFieldErrors: ProductFieldErrors = {};

    if (!form.nombre.trim()) nextFieldErrors.nombre = "Ingresá el nombre.";
    if (!form.precio.trim()) nextFieldErrors.precio = "Ingresá el precio.";
    if (!form.peso.trim()) nextFieldErrors.peso = "Ingresá el peso.";
    if (!form.medidas.trim()) nextFieldErrors.medidas = "Ingresá las medidas.";
    if (!form.descripcion.trim()) nextFieldErrors.descripcion = "Ingresá la descripción.";
    if (form.categorias_ids.length === 0) {
      nextFieldErrors.categorias_ids = "Seleccioná al menos una categoría.";
    }
    if (!imagen && !isEditing) nextFieldErrors.imagen = "Seleccioná una imagen principal.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError("");
      return;
    }

    setFieldErrors({});
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("nombre", form.nombre.trim());
      formData.append("precio", form.precio);
      formData.append("peso", form.peso);
      formData.append("medidas", form.medidas.trim());
      formData.append("descripcion", form.descripcion.trim());
      formData.append("disponible", disponible ? "true" : "false");
      if (form.capacidad.trim()) formData.append("capacidad", form.capacidad.trim());
      if (form.categorias_ids.length > 0) {
        form.categorias_ids.forEach((id) => {
          formData.append("categorias_ids", id);
        });
      }
      if (imagen) formData.append("imagen", imagen);

      const created = await onSave(formData);
      onCreated(created);
    } catch (error) {
      const parsed = parseProductApiError(error);
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.submitError);
    }
  };

  return (
    <form id={CREATE_PRODUCT_FORM_ID} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!isEditing && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -4 }}>
          <button
            type="button"
            onClick={onSwitchToExisting}
            style={{
              ...tertiaryButtonStyle(),
              borderColor: "var(--worker-rail)",
              color: "var(--worker-rail)",
            }}
          >
            🔍 Usar un producto existente
          </button>
        </div>
      )}
      <SectionCard
        title="Datos principales"
        description="Completá lo mínimo necesario para identificar y vender el producto sin apretar campos en horizontal."
      >
        <div style={responsiveGridStyle}>
          <FormField label="Nombre" error={fieldErrors.nombre}>
            <input
              autoFocus
              type="text"
              value={form.nombre}
              onChange={(event) => setField("nombre")(event.target.value)}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Precio" error={fieldErrors.precio}>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.precio}
              onChange={(event) => setField("precio")(event.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>
        <div style={responsiveGridStyle}>
          <FormField label="Peso" error={fieldErrors.peso}>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.peso}
              onChange={(event) => setField("peso")(event.target.value)}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Categorías" error={fieldErrors.categorias_ids}>
            <div
              style={{
                ...inputStyle,
                maxHeight: "150px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "10px 12px",
              }}
            >
              {categorias.length === 0 ? (
                <span style={{ color: "var(--worker-ink-tertiary)", fontSize: 13 }}>No hay categorías disponibles</span>
              ) : (
                categorias.map((categoria) => {
                  const isChecked = form.categorias_ids.includes(String(categoria.id));
                  return (
                    <label
                      key={categoria.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        color: "var(--worker-ink-secondary)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          const categoryId = String(categoria.id);
                          const shouldInclude = event.target.checked;
                          setForm((current) => ({
                            ...current,
                            categorias_ids: shouldInclude
                              ? current.categorias_ids.includes(categoryId)
                                ? current.categorias_ids
                                : [...current.categorias_ids, categoryId]
                              : current.categorias_ids.filter((id) => id !== categoryId),
                          }));
                          setFieldErrors((current) => ({ ...current, categorias_ids: undefined }));
                        }}
                      />
                      {categoria.nombre}
                    </label>
                  );
                })
              )}
            </div>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Detalle y medidas"
        description="Agrupamos los datos físicos y la descripción para que el recorrido siga una sola columna natural."
      >
        <div style={responsiveGridStyle}>
          <FormField label="Medidas" error={fieldErrors.medidas}>
            <input
              type="text"
              value={form.medidas}
              onChange={(event) => setField("medidas")(event.target.value)}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Capacidad" error={fieldErrors.capacidad} required={false}>
            <input
              type="text"
              value={form.capacidad}
              onChange={(event) => setField("capacidad")(event.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Descripción" error={fieldErrors.descripcion}>
          <textarea
            value={form.descripcion}
            onChange={(event) => setField("descripcion")(event.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Imagen principal del producto"
        description="La vista previa aparece antes de enviar y el selector distingue esta foto de las fotos de variantes."
      >
        <WorkerPhotoPicker
          mode="product"
          label="Foto del producto"
          helper="Podés sacar la foto en el momento o elegirla desde la galería."
          error={fieldErrors.imagen}
          value={imagen}
          onChange={(nextImage) => {
            setImagen(nextImage);
            setFieldErrors((current) => ({ ...current, imagen: undefined }));
          }}
        />
      </SectionCard>

      <SectionCard title="Visibilidad" description="Controlá si el producto aparece en el catálogo público inmediatamente.">
        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 14,
            color: "var(--worker-ink-secondary)",
          }}
        >
          <input
            type="checkbox"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
          />
          { disponible ? "Publicar en la web (haz clic para dejarlo oculto)." : "No publicar (haz clic para mostrarlo)." }
        </label>
      </SectionCard>

      {submitError && <InlineNotice tone="error">{submitError}</InlineNotice>}

      <InlineNotice tone="info">
        La carga usa multipart/form-data. Si el backend devuelve error, mantenemos los valores para corregir rápido desde el teléfono.
      </InlineNotice>
    </form>
  );
}

function SelectProductSection({
  productos,
  loading,
  error,
  onRetry,
  onSelected,
}: {
  productos: WorkerProductoSlim[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelected: (product: WorkerProductoSlim) => void;
}) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    return productos.filter((p) =>
      p.nombre.toLowerCase().includes(filter.toLowerCase())
    );
  }, [productos, filter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard
        title="Catálogo de productos"
        description="Seleccioná un producto de la lista para continuar directamente con la carga de variantes."
      >
        <input
          autoFocus
          type="text"
          placeholder="Escribí para buscar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={inputStyle}
        />
      </SectionCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
        {loading && <p style={helperStyle}>Cargando productos...</p>}
        {error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={errorStyle}>Error: {error}</p>
            <button type="button" onClick={onRetry} style={tertiaryButtonStyle()}>Reintentar</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p style={helperStyle}>No se encontraron productos con "{filter}"</p>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelected(p)}
            style={{
              ...inputStyle,
              textAlign: "left",
              background: "var(--worker-bench)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {p.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

function SuccessSection({
  createdProduct,
  createdProductLabel,
  onEditBase,
}: {
  createdProduct: WorkerProducto;
  createdProductLabel: string;
  onEditBase: () => void;
  onAddVariant: () => void;
  onManageVariants: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <InlineNotice tone="success" style={{ flex: 1, margin: 0 }}>
          Producto: <strong>{createdProductLabel}</strong>
        </InlineNotice>
        <button onClick={onEditBase} style={{ ...tertiaryButtonStyle(), marginLeft: 8 }}>Editar información</button>
      </div>

      <SectionCard
        title="Estado actual"
        description="Este resumen refleja si el producto quedó como borrador o si ya está listo para mostrarse en la tienda."
      >
        <div style={responsiveGridStyle}>
          <SummaryItem label="Estado" value={getProductPublicationLabel(createdProduct.estado)} />
          <SummaryItem label="Visible en tienda" value={createdProduct.disponible ? "Sí" : "No"} />
        </div>
      </SectionCard>

      <SectionCard
        title="Resumen rápido"
        description="Confirmá los datos base antes de pasar a la primera variante."
      >
        <div style={responsiveGridStyle}>
          <SummaryItem label="Precio" value={createdProduct.precio} />
          <SummaryItem label="Peso" value={createdProduct.peso} />
          <SummaryItem label="Medidas" value={createdProduct.medidas} />
          <SummaryItem label="Capacidad" value={createdProduct.capacidad ?? "—"} />
        </div>
      </SectionCard>

      <SectionCard
        title="Descripción"
        description="Este bloque mantiene una jerarquía legible también en pantallas chicas."
      >
        <div
          style={{
            padding: "12px 14px",
            background: "var(--worker-bench)",
            border: "1px solid var(--worker-border-soft)",
            borderRadius: 10,
            fontSize: 14,
            color: "var(--worker-ink-secondary)",
            lineHeight: 1.6,
          }}
        >
          {createdProduct.descripcion}
        </div>
      </SectionCard>

      {createdProduct.imagen && (
        <SectionCard
          title="Imagen principal"
          description="La imagen del producto ya quedó cargada como referencia para la siguiente variante."
        >
          <img
            src={createdProduct.imagen}
            alt={`Imagen principal de ${createdProductLabel}`}
            style={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid var(--worker-border-soft)",
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}

/**
 * Intent: after creating a base product, the worker must quickly add the first sellable variant and attach the right photos.
 * Palette: variant/image guidance uses the same warm worker tokens, with semantic success/error only when needed.
 * Depth: section cards and inset controls make upload targets obvious without visual clutter.
 * Surfaces: product context notice sits above neutral cards, while previews use control-level surfaces.
 * Typography: short labels and helper copy prioritize scanability during a standing/mobile workflow.
 * Spacing: repeated 12/16px groupings keep the form readable and thumb-safe.
 */
function AddVariantSection({
  createdProduct,
  colores,
  varianteMutation,
  imagenMutation,
  onCompleted,
}: {
  createdProduct: WorkerProducto;
  colores: WorkerColor[];
  varianteMutation: ReturnType<typeof useCrearVariante>;
  imagenMutation: ReturnType<typeof useSubirImagen>;
  onCompleted: () => void;
}) {
  const [colorId, setColorId] = useState("");
  const [item, setItem] = useState("");
  const [stock, setStock] = useState("0");
  const [activo, setActivo] = useState(true);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<VariantFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUpload, setPendingUpload] = useState<PendingVariantUpload | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  const clearPendingUpload = () => {
    setPendingUpload(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextFieldErrors: VariantFieldErrors = {};
    if (!colorId) nextFieldErrors.colorId = "Seleccioná un color.";
    if (!item.trim()) nextFieldErrors.item = "Ingresá el número de item.";
    if (!stock.trim()) nextFieldErrors.stock = "Ingresá el stock.";
    if (!codigoBarras.trim()) nextFieldErrors.codigo_barras = "Ingresá el código de barras.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError("");
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setSuccess("");
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const requestKey = buildVariantUploadRequestKey({
      productoId: createdProduct.id,
      colorId,
      item,
      codigo_barras: codigoBarras,
      stock,
      activo,
      esPrincipal,
      imagenes,
    });
    const resumeUpload = pendingUpload?.requestKey === requestKey ? pendingUpload : null;
    const totalImages = imagenes.length;
    setUploadProgress(
      totalImages > 0 && resumeUpload
        ? Math.round((resumeUpload.nextImageIndex / totalImages) * 100)
        : 0
    );
    let canRetryExistingVariant = Boolean(resumeUpload);

    try {
      const createdVariant = resumeUpload?.variant ?? await varianteMutation.mutateAsync({
        productoId: createdProduct.id,
        data: {
          color: Number(colorId),
          stock: Number(stock),
          activo,
          item: item.trim(),
          codigo_barras: codigoBarras.trim(),
        },
      }) as WorkerCreatedVariant;

      if (!createdVariant?.id) {
        throw new Error("La variante se creó sin id válido para asociar imágenes.");
      }

      if (!resumeUpload) {
        canRetryExistingVariant = true;
        setPendingUpload({
          variant: createdVariant,
          requestKey,
          nextImageIndex: 0,
        });
      }

      const startIndex = resumeUpload?.nextImageIndex ?? 0;
      for (let index = startIndex; index < totalImages; index += 1) {
        const formData = new FormData();
        formData.append("imagen", imagenes[index]);
        formData.append("orden", String(index));
        formData.append("es_principal", index === 0 && esPrincipal ? "true" : "false");
        formData.append("variante", String(createdVariant.id));
        await imagenMutation.mutateAsync({ productoId: createdProduct.id, data: formData });
        const nextImageIndex = index + 1;
        setPendingUpload({
          variant: createdVariant,
          requestKey,
          nextImageIndex,
        });
        setUploadProgress(Math.round((nextImageIndex / totalImages) * 100));
      }

      clearPendingUpload();
      setSuccess(totalImages > 0
        ? `Variante ${createdVariant.item} creada y fotos asociadas correctamente.`
        : `Variante ${createdVariant.item} creada correctamente.`);
      closeTimeoutRef.current = window.setTimeout(() => {
        onCompleted();
      }, 900);
    } catch (error) {
      const baseError = parseInlineApiError(error);
      setSubmitError(`${baseError}${createdVariantRetryMessageSuffix(canRetryExistingVariant)}`);
    }
  };

  const workerTheme = useWorkerTheme().theme;

  return (
    <form id={ADD_VARIANT_FORM_ID} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InlineNotice tone="info">
        Producto seleccionado: <strong style={{ color: "var(--worker-ink)" }}>{createdProduct.nombre}</strong>
      </InlineNotice>

      <SectionCard
        title="Datos de la variante"
        description="Primero generamos la variante. Recién con ese id se habilita la asociación correcta de imágenes."
      >
        <div style={responsiveGridStyle}>
          <FormField label="Color" error={fieldErrors.colorId}>
            <select
              autoFocus
              value={colorId}
              onChange={(event) => {
                clearPendingUpload();
                setColorId(event.target.value);
                setFieldErrors((current) => ({ ...current, colorId: undefined }));
              }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Seleccioná un color</option>
              {colores.map((color) => (
                <option key={color.id} value={String(color.id)}>
                  {color.nombre} ({color.hex})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="No. Ítem (SKU)" error={fieldErrors.item}>
            <input
              type="text"
              value={item}
              onChange={(event) => {
                clearPendingUpload();
                setItem(event.target.value);
                setFieldErrors((current) => ({ ...current, item: undefined }));
              }}
              style={inputStyle}
            />
          </FormField>
        </div>

        <div style={responsiveGridStyle}>
          <FormField label="Stock" error={fieldErrors.stock}>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={stock}
              onChange={(event) => {
                clearPendingUpload();
                setStock(event.target.value);
                setFieldErrors((current) => ({ ...current, stock: undefined }));
              }}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Código de Barras" error={fieldErrors.codigo_barras}>
            <input 
            type="text" 
            value={codigoBarras} 
            onChange={(event) => {
                clearPendingUpload();
                setCodigoBarras(event.target.value);
                setFieldErrors((current) => ({ ...current, codigoBarras: undefined }))
            }} 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }} 
            style={inputStyle} />
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
                {codigoBarras ? (
                  <div className="my-3">
                    <Barcode value={codigoBarras} background="transparent" lineColor={workerTheme == "dark" ? "#ffffff" : "#000000"} width={1.5} height={40} />
                  </div>
                ) : (<></>)}
              </div>
          </FormField>
        </div>

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 14,
            color: "var(--worker-ink-secondary)",
          }}
        >
          <input
            type="checkbox"
            checked={activo}
            onChange={(event) => {
              clearPendingUpload();
              setActivo(event.target.checked);
            }}
          />
          { activo? "Variante activa (haz clic para desactivarla)." : "Variante inactiva (haz clic para activarla)."}
        </label>
      </SectionCard>

      <SectionCard
        title="Fotos de la variante"
        description="Estas fotos NO son la imagen principal del producto: se cargan después con el id de la variante recién creada."
      >
        <WorkerPhotoPicker
          mode="variant"
          label="Fotos para esta variante"
          helper="Podés agregar una foto desde cámara o varias desde la galería."
          value={imagenes}
          onChange={(nextImagenes) => {
            clearPendingUpload();
            setImagenes(nextImagenes);
          }}
        />

        {imagenes.length > 0 && (
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: 14,
              color: "var(--worker-ink-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={esPrincipal}
              onChange={(event) => {
                clearPendingUpload();
                setEsPrincipal(event.target.checked);
              }}
            />
            Marcar la primera foto como principal de la variante
          </label>
        )}
      </SectionCard>

      {pendingUpload && (
        <InlineNotice tone="info">
          La variante ya fue creada. Si falló una foto, reintentá y seguimos cargando las pendientes sin duplicar la variante.
        </InlineNotice>
      )}

      {(varianteMutation.isPending || imagenMutation.isPending) && (
        <SectionCard
          title="Progreso"
          description={varianteMutation.isPending
            ? "Estamos creando la variante antes de subir cualquier imagen."
            : "Ahora sí estamos asociando cada foto con el id de variante creado."}
        >
          {imagenMutation.isPending && uploadProgress > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "var(--worker-bench)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${uploadProgress}%`,
                    background: "var(--worker-rail)",
                    borderRadius: 999,
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <p style={helperStyle}>Subiendo imágenes… {uploadProgress}%</p>
            </div>
          ) : (
            <p style={helperStyle}>Creando la variante para obtener el id necesario antes de subir imágenes.</p>
          )}
        </SectionCard>
      )}

      {submitError && <InlineNotice tone="error">{submitError}</InlineNotice>}
      {success && <InlineNotice tone="success">{success}</InlineNotice>}
    </form>
  );
}

function SelectVariantToEditSection({
  product,
  onVariantSelected,
}: {
  product: WorkerProducto;
  onVariantSelected: (variant: WorkerVariant) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {product.variantes?.map((v) => (
        <button
          key={v.variant_id}
          onClick={() => onVariantSelected(v)}
          style={{
            ...inputStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--worker-shelf)",
            cursor: "pointer"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: v.color.hex, border: "1px solid var(--worker-border)" }} />
            <span>{v.color.nombre} - {v.item}</span>
          </div>
          <span style={{ fontWeight: 700, color: "var(--worker-rail)" }}>Stock: {v.stock} ✏️</span>
        </button>
      ))}
    </div>
  );
}

function EditVariantSection({
  product,
  variant,
  varianteMutation,
  imagenMutation,
  onCompleted,
}: {
  product: WorkerProducto;
  variant: WorkerVariant;
  colores: WorkerColor[];
  varianteMutation: ReturnType<typeof useEditarVariante>;
  imagenMutation: ReturnType<typeof useSubirImagen>;
  onCompleted: () => void;
}) {
  const [item, setItem] = useState(variant.item || "");
  const [stock, setStock] = useState(String(variant.stock));
  const [activo, setActivo] = useState(variant.activo);
  const [precio, setPrecio] = useState(variant.precio ? String(variant.precio) : "");
  const [codigoBarras, setCodigoBarras] = useState(variant.codigo_barras || "");
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [fieldErrors] = useState<EditVariantFieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    try {
      await varianteMutation.mutateAsync({
        variantId: variant.variant_id,
        data: {
          stock: Number(stock),
          activo,
          item: item.trim(),
          precio: precio.trim() ? Number(precio) : null,
          codigo_barras: codigoBarras.trim()
        },
      });

      // Subir nuevas imágenes si las hay
      for (let i = 0; i < imagenes.length; i++) {
        const formData = new FormData();
        formData.append("imagen", imagenes[i]);
        formData.append("variante", String(variant.variant_id));
        await imagenMutation.mutateAsync({ productoId: product.id, data: formData });
      }

      onCompleted();
    } catch (error) {
      setSubmitError(parseInlineApiError(error));
    }
  };

  const workerTheme = useWorkerTheme().theme;

  return (
    <form id={EDIT_VARIANT_FORM_ID} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Datos de la variante" description="Actualizá los valores específicos de esta variante.">
        <FormField label="Color" required={false}>
          <div style={{ ...inputStyle, background: "var(--worker-bench)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: variant.color.hex }} />
            {variant.color.nombre}
          </div>
        </FormField>
        <div style={responsiveGridStyle}>
          <FormField label="Item/SKU" error={fieldErrors.item}>
            <input type="text" value={item} onChange={(e) => setItem(e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Stock" error={fieldErrors.stock}>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div style={responsiveGridStyle}>
          <FormField label="Precio de la variante (opcional)" required={false}>
            <input type="number" step="0.01" min={1} value={precio} onChange={(e) => setPrecio(e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Código de Barras">
            <input type="text" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }} style={inputStyle} />
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              {codigoBarras ? (
                <div className="my-3">
                  <Barcode value={codigoBarras} background="transparent" lineColor={workerTheme == "dark" ? "#ffffff" : "#000000"} width={1.5} height={40} />
                </div>
              ) : (<></>)}
            </div>
          </FormField>
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          { activo ? "Variante activa (haz clic para desactivarla)." : "Variante inactiva (haz clic para activarla)."}
        </label>
      </SectionCard>

      <SectionCard title="Nuevas fotos" description="Agregá más fotos a esta variante. Las fotos existentes se gestionan desde el listado general.">
        <WorkerPhotoPicker
          mode="variant"
          label="Agregar fotos"
          helper="Seleccioná imágenes adicionales para esta variante."
          value={imagenes}
          onChange={setImagenes}
        />
      </SectionCard>

      {submitError && <InlineNotice tone="error">{submitError}</InlineNotice>}
    </form>
  );
}

function WorkerPhotoPicker(props: WorkerPhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const files = props.mode === "product"
    ? (props.value ? [props.value] : [])
    : props.value;
  const previews = useObjectPreviewUrls(files);

  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerGallery = () => galleryInputRef.current?.click();

  const handleCameraChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (props.mode === "product") {
      props.onChange(nextFiles[0] ?? null);
    } else if (nextFiles[0]) {
      props.onChange(mergeFiles(props.value, [nextFiles[0]]));
    }
    event.target.value = "";
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (props.mode === "product") {
      props.onChange(nextFiles[0] ?? null);
    } else {
      props.onChange(mergeFiles(props.value, nextFiles));
    }
    event.target.value = "";
  };

  const removeAt = (index: number) => {
    if (props.mode === "product") {
      props.onChange(null);
      return;
    }
    props.onChange(props.value.filter((_, currentIndex) => currentIndex !== index));
  };

  const clearAll = () => {
    if (props.mode === "product") {
      props.onChange(null);
      return;
    }
    props.onChange([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>{props.label}</span>
        <p style={helperStyle}>{props.helper}</p>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        style={{ display: "none" }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={props.mode === "variant"}
        onChange={handleGalleryChange}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={triggerCamera} style={secondaryButtonStyle(false)}>
          {props.mode === "product" ? "Sacar foto" : "Agregar desde cámara"}
        </button>
        <button type="button" onClick={triggerGallery} style={secondaryButtonStyle(false)}>
          {props.mode === "product" ? "Elegir de la galería" : "Agregar desde galería"}
        </button>
        {files.length > 0 && (
          <button type="button" onClick={clearAll} style={tertiaryButtonStyle()}>
            Quitar {props.mode === "product" ? "foto" : "todas las fotos"}
          </button>
        )}
      </div>

      {props.error && <p style={errorStyle}>{props.error}</p>}

      {files.length > 0 && (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))" }}>
          {previews.map((previewUrl, index) => (
            <div
              key={`${previewUrl}-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--worker-border-soft)",
                background: "var(--worker-overlay)",
              }}
            >
              <img
                src={previewUrl}
                alt={props.mode === "product"
                  ? "Vista previa de la imagen principal del producto"
                  : `Vista previa de la foto ${index + 1} de la variante`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid var(--worker-border-soft)",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ ...helperStyle, fontSize: 11 }}>
                  {props.mode === "product" ? "Imagen principal" : `Foto ${index + 1}`}
                </span>
                <button type="button" onClick={() => removeAt(index)} style={tertiaryButtonStyle()}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionCardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "var(--worker-ink)", fontWeight: 700 }}>
          {title}
        </h3>
        <p style={helperStyle}>{description}</p>
      </div>
      {children}
    </section>
  );
}

function InlineNotice({
  tone,
  children,
  style,
}: {
  tone: "info" | "success" | "error";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const noticeTheme = {
    info: {
      background: "var(--worker-info-bg)",
      border: "var(--worker-info-border)",
      color: "var(--worker-info-fg)",
    },
    success: {
      background: "var(--worker-inventory-bg)",
      border: "var(--worker-inventory-border)",
      color: "var(--worker-inventory-fg)",
    },
    error: {
      background: "var(--worker-error-bg)",
      border: "var(--worker-error-border)",
      color: "var(--worker-error-fg)",
    },
  }[tone];

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: noticeTheme.background,
        border: `1px solid ${noticeTheme.border}`,
        ...style,
      }}
    >
      <p style={tone === "success" ? successStyle : { ...errorStyle, color: noticeTheme.color }}>
        {children}
      </p>
    </div>
  );
}

function FormField({
  label,
  error,
  required = true,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>{required ? `${label} *` : label}</label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--worker-bench)",
          border: "1px solid var(--worker-border-soft)",
          fontSize: 14,
          color: "var(--worker-ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ModalButton({
  children,
  onClick,
  disabled = false,
  kind,
  type = "button",
  form,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind: "primary" | "secondary";
  type?: "button" | "submit";
  form?: string;
}) {
  const style = kind === "primary"
    ? primaryButtonStyle(disabled)
    : secondaryButtonStyle(disabled);

  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: disabled ? "var(--worker-ink-muted)" : "var(--worker-rail)",
    border: "none",
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    minHeight: 44,
  };
}

function secondaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: disabled ? "var(--worker-ink-muted)" : "var(--worker-ink-secondary)",
    background: "var(--worker-bench)",
    border: "1px solid var(--worker-border)",
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    minHeight: 44,
  };
}

function tertiaryButtonStyle(): CSSProperties {
  return {
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--worker-ink-secondary)",
    background: "transparent",
    border: "1px solid var(--worker-border-soft)",
    borderRadius: 999,
    cursor: "pointer",
  };
}

function variantePendingCopy(isCreating: boolean, isUploading: boolean): string {
  if (isCreating) return "Creando variante…";
  if (isUploading) return "Subiendo fotos…";
  return "Guardar variante";
}

function buildVariantUploadRequestKey({
  productoId,
  colorId,
  item,
  codigo_barras,
  stock,
  activo,
  esPrincipal,
  imagenes,
}: {
  productoId: number;
  colorId: string;
  item: string;
  codigo_barras: string;
  stock: string;
  activo: boolean;
  esPrincipal: boolean;
  imagenes: File[];
}) {
  return JSON.stringify({
    productoId,
    colorId,
    item: item.trim(),
    codigo_barras: codigo_barras.trim(),
    stock: stock.trim(),
    activo,
    esPrincipal,
    imagenes: imagenes.map((imagen) => ({
      name: imagen.name,
      size: imagen.size,
      lastModified: imagen.lastModified,
      type: imagen.type,
    })),
  });
}

function createdVariantRetryMessageSuffix(canRetryExistingVariant: boolean) {
  if (!canRetryExistingVariant) return "";
  return " La variante ya fue creada; reintentá para seguir con las fotos pendientes sin duplicarla.";
}

function buildPartialUnifiedCreateMessage(state: PartialUnifiedCreateState) {
  const productLabel = state.product.nombre || `#${state.product.id}`;

  if (state.failedStep === "variant") {
    return `El producto ${productLabel} ya se creó como borrador, pero falló la creación de la primera variante. Cerrá este flujo y retomá desde ese producto para evitar duplicados.`;
  }

  if (state.failedStep === "images") {
    return `El producto ${productLabel} y su primera variante ya fueron creados, pero falló la carga de imágenes. Cerrá este flujo y retomá desde ese producto para evitar duplicados.`;
  }

  return `El producto ${productLabel} ya fue creado, pero no se pudo completar la publicación. Cerrá este flujo y retomá desde ese producto para evitar duplicados.`;
}

function useObjectPreviewUrls(files: File[]) {
  const objectUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [objectUrls]);

  return objectUrls;
}

function mergeFiles(currentFiles: File[], nextFiles: File[]) {
  const merged = [...currentFiles];
  nextFiles.forEach((file) => {
    const exists = merged.some((current) => (
      current.name === file.name
      && current.size === file.size
      && current.lastModified === file.lastModified
    ));
    if (!exists) merged.push(file);
  });
  return merged;
}

function parseProductApiError(error: unknown): {
  fieldErrors: ProductFieldErrors;
  submitError: string;
} {
  const fallback = {
    fieldErrors: {},
    submitError: parseInlineApiError(error),
  };

  const responseData = (error as AxiosError<ApiErrorPayload>)?.response?.data;
  if (!responseData || typeof responseData !== "object") return fallback;

  const fieldErrors: ProductFieldErrors = {};
  let submitError = "";

  Object.entries(responseData).forEach(([key, value]) => {
    const message = normalizeApiMessage(value);
    if (!message) return;

    if (key === "detail" || key === "non_field_errors") {
      submitError = submitError || message;
      return;
    }

    if (key === "categorias_ids") {
      fieldErrors.categorias_ids = message;
      return;
    }

    if (key === "imagen") {
      fieldErrors.imagen = message;
      return;
    }

    if (isProductFieldKey(key)) {
      fieldErrors[key] = message;
      return;
    }

    submitError = submitError || message;
  });

  return {
    fieldErrors,
    submitError: submitError || fallback.submitError,
  };
}

function parseInlineApiError(error: unknown): string {
  const responseData = (error as AxiosError<ApiErrorPayload>)?.response?.data;
  const status = (error as AxiosError)?.response?.status;

  if (status && status >= 500) {
    return "Ocurrió un error del servidor. Reintentá en unos segundos.";
  }

  if (responseData && typeof responseData === "object") {
    if (typeof responseData.detail === "string" && responseData.detail.trim()) {
      return responseData.detail;
    }

    for (const value of Object.values(responseData)) {
      const message = normalizeApiMessage(value);
      if (message) return message;
    }
  }

  return error instanceof Error ? error.message : "Ocurrió un error al guardar.";
}

function normalizeApiMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : ""))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function isProductFieldKey(key: string): key is keyof ProductFormState {
  return [
    "nombre",
    "precio",
    "peso",
    "medidas",
    "descripcion",
    "capacidad",
    "categorias_ids",
  ].includes(key);
}
