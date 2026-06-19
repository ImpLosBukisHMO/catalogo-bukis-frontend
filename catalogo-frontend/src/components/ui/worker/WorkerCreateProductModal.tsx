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
};

type ProductFormState = {
  nombre: string;
  precio: string;
  peso: string;
  medidas: string;
  descripcion: string;
  capacidad: string;
  categoria: string;
};

type ProductFieldErrors = Partial<Record<keyof ProductFormState | "imagen", string>>;

type VariantFieldErrors = Partial<Record<"colorId" | "item" | "stock", string>>;
type EditVariantFieldErrors = Partial<Record<"colorId" | "item" | "stock" | "precio", string>>;

type PendingVariantUpload = {
  variant: WorkerCreatedVariant;
  requestKey: string;
  nextImageIndex: number;
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
  categoria: "",
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
                {mode === "edit-base-product" && "Editar producto base"}
                {mode === "select-product" && "Elegir producto base"}
                {mode === "success" && (editingProduct ? "Gestionar producto" : "Producto creado")}
                {mode === "add-variant" && "Agregar variante"}
                {mode === "select-variant-to-edit" && "Seleccionar variante"}
                {mode === "edit-variant" && "Editar variante"}
              </WorkerDialogTitle>
              <WorkerDialogDescription>
                {mode === "create-product" && "Cargá el producto base con una foto clara."}
                {mode === "edit-base-product" && "Modificá los datos generales del producto."}
                {mode === "select-product" && "Buscá un producto base ya existente."}
                {mode === "success" && "El producto quedó listo. Revisá el resumen o gestioná sus variantes."}
                {mode === "add-variant" && "Cargá una nueva combinación de color y stock."}
                {mode === "select-variant-to-edit" && "Elegí qué variante quieres modificar."}
                {mode === "edit-variant" && "Actualizá stock, precio o fotos de la variante."}
              </WorkerDialogDescription>
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
          {(mode === "create-product" || mode === "edit-base-product") && (
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
                if (mode === "edit-base-product") {
                  setMode("success");
                } else {
                  setMode("success");
                }
              }}
              onSwitchToExisting={() => setMode("select-product")}
              isEditing={mode === "edit-base-product"}
            />
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
              onCompleted={() => setMode("select-variant-to-edit")}
            />
          )}
        </WorkerDialogBody>

        <WorkerDialogFooter className="worker-dialog-footer--stack-sm">
          {(mode === "create-product" || mode === "edit-base-product") && (
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
              <ModalButton kind="secondary" onClick={() => onOpenChange(false)}>
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
                onClick={() => mode === "edit-variant" ? setMode("select-variant-to-edit") : setMode("success")}
                disabled={isPending}
              >
                Volver
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
        categoria: Array.isArray(p.categorias) && p.categorias.length ? String(p.categorias[0]) : "",
      };
    }
    return defaultProductForm;
  });

  const [imagen, setImagen] = useState<File | null>(null);
  const [disponible, setDisponible] = useState(initialProduct?.disponible ?? false);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const setField = (key: keyof ProductFormState) => (value: string) => {
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
      if (form.categoria) formData.append("categorias_ids", form.categoria);
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
            🔍 Buscar producto base existente
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

          <FormField label="Categoría" error={fieldErrors.categoria} required={false}>
            <select
              value={form.categoria}
              onChange={(event) => setField("categoria")(event.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={String(categoria.id)}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={responsiveGridStyle}>
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
          Publicar inmediatamente (Disponible en la web)
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
        <button onClick={onEditBase} style={{ ...tertiaryButtonStyle(), marginLeft: 8 }}>Editar Base</button>
      </div>

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

  return (
    <form id={ADD_VARIANT_FORM_ID} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InlineNotice tone="info">
        Producto base: <strong style={{ color: "var(--worker-ink)" }}>{createdProduct.nombre}</strong>
      </InlineNotice>

      <SectionCard
        title="Datos de la variante"
        description="Primero generamos la variante. Recién con ese id se habilita la asociación correcta de imágenes."
      >
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

        <div style={responsiveGridStyle}>
          <FormField label="No. Item (SKU)" error={fieldErrors.item}>
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
          Variante activa
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
          precio: precio.trim() ? Number(precio) : null
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
        <FormField label="Precio Variante (opcional)">
          <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} style={inputStyle} />
        </FormField>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Variante activa
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
  stock,
  activo,
  esPrincipal,
  imagenes,
}: {
  productoId: number;
  colorId: string;
  item: string;
  stock: string;
  activo: boolean;
  esPrincipal: boolean;
  imagenes: File[];
}) {
  return JSON.stringify({
    productoId,
    colorId,
    item: item.trim(),
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
      fieldErrors.categoria = message;
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
    "categoria",
  ].includes(key);
}
