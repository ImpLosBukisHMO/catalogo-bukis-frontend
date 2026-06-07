import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { AxiosError } from "axios";
import {
  useCrearProducto,
  useCrearVariante,
  useSubirImagen,
} from "../../../queries/workerProducts";
import type {
  WorkerCategoria,
  WorkerColor,
  WorkerProductoSlim,
} from "../../../services/worker";
import type { WorkerProducto } from "../../../types/worker";
import {
  WorkerDialogBody,
  WorkerDialogContent,
  WorkerDialogDescription,
  WorkerDialogFooter,
  WorkerDialogHeader,
  WorkerDialogRoot,
  WorkerDialogTitle,
} from "./WorkerDialog";

export type ModalMode = "create-product" | "success" | "add-variant";

export type WorkerCreateProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: WorkerCategoria[];
  colores: WorkerColor[];
  productos: WorkerProductoSlim[];
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

type ApiErrorPayload = {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 13,
  background: "var(--worker-control-bg)",
  border: "1px solid var(--worker-control-border)",
  borderRadius: 6,
  color: "var(--worker-ink)",
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--worker-ink-secondary)",
  fontWeight: 500,
};

const errorStyle: CSSProperties = {
  color: "var(--worker-error-fg)",
  fontSize: 12,
  margin: 0,
};

const successStyle: CSSProperties = {
  color: "var(--worker-inventory-fg)",
  fontSize: 12,
  margin: 0,
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

export function WorkerCreateProductModal({
  open,
  onOpenChange,
  categorias,
  colores,
  productos,
}: WorkerCreateProductModalProps) {
  const [mode, setMode] = useState<ModalMode>("create-product");
  const [createdProduct, setCreatedProduct] = useState<WorkerProducto | null>(null);

  const crearProductoM = useCrearProducto();
  const crearVarianteM = useCrearVariante();
  const subirImagenM = useSubirImagen();

  const isPending =
    crearProductoM.isPending || crearVarianteM.isPending || subirImagenM.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  const handleCloseClick = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const createdProductLabel = createdProduct?.nombre
    ?? productos.find((producto) => producto.id === createdProduct?.id)?.nombre
    ?? "";

  return (
    <WorkerDialogRoot open={open} onOpenChange={handleOpenChange}>
      <WorkerDialogContent size="lg">
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
                {mode === "success" && "Producto creado"}
                {mode === "add-variant" && "Agregar variante"}
              </WorkerDialogTitle>
              <WorkerDialogDescription>
                {mode === "create-product" && "Cargá el producto base con su imagen principal."}
                {mode === "success" && "El producto quedó listo para usar en nuevas variantes."}
                {mode === "add-variant" && "Creá una variante para el producto recién cargado."}
              </WorkerDialogDescription>
            </div>

            <button
              type="button"
              onClick={handleCloseClick}
              disabled={isPending}
              aria-label="Cerrar modal"
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                lineHeight: 1,
                color: isPending
                  ? "var(--worker-ink-muted)"
                  : "var(--worker-ink-tertiary)",
                cursor: isPending ? "not-allowed" : "pointer",
                padding: "2px 4px",
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          </div>
        </WorkerDialogHeader>

        <WorkerDialogBody scrollable>
          {mode === "create-product" && (
            <CreateProductSection
              categorias={categorias}
              mutation={crearProductoM}
              onCreated={(product) => {
                setCreatedProduct(product);
                setMode("success");
              }}
            />
          )}

          {mode === "success" && createdProduct && (
            <SuccessSection createdProduct={createdProduct} createdProductLabel={createdProductLabel} />
          )}

          {mode === "add-variant" && createdProduct && (
            <AddVariantSection
              createdProduct={createdProduct}
              colores={colores}
              varianteMutation={crearVarianteM}
              imagenMutation={subirImagenM}
              onCompleted={() => onOpenChange(false)}
            />
          )}
        </WorkerDialogBody>

        <WorkerDialogFooter>
          {mode === "create-product" && (
            <ModalButton kind="secondary" onClick={handleCloseClick} disabled={isPending}>
              Cancelar
            </ModalButton>
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
            <ModalButton kind="secondary" onClick={handleCloseClick} disabled={isPending}>
              Cerrar
            </ModalButton>
          )}
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}

function CreateProductSection({
  categorias,
  mutation,
  onCreated,
}: {
  categorias: WorkerCategoria[];
  mutation: ReturnType<typeof useCrearProducto>;
  onCreated: (product: WorkerProducto) => void;
}) {
  const [form, setForm] = useState<ProductFormState>(defaultProductForm);
  const [imagen, setImagen] = useState<File | null>(null);
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
    if (!imagen) nextFieldErrors.imagen = "Seleccioná una imagen.";

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
      if (form.capacidad.trim()) formData.append("capacidad", form.capacidad.trim());
      if (form.categoria) formData.append("categorias_ids", form.categoria);
      formData.append("imagen", imagen as File);

      const created = await mutation.mutateAsync(formData);
      onCreated(created);
    } catch (error) {
      const parsed = parseProductApiError(error);
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.submitError);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            value={form.peso}
            onChange={(event) => setField("peso")(event.target.value)}
            style={inputStyle}
          />
        </FormField>

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

      <FormField label="Descripción" error={fieldErrors.descripcion}>
        <textarea
          value={form.descripcion}
          onChange={(event) => setField("descripcion")(event.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </FormField>

      <FormField label="Imagen" error={fieldErrors.imagen}>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            setImagen(event.target.files?.[0] ?? null);
            setFieldErrors((current) => ({ ...current, imagen: undefined }));
          }}
          style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}
        />
      </FormField>

      {submitError && <p style={errorStyle}>{submitError}</p>}

      <p style={{ margin: 0, fontSize: 12, color: "var(--worker-ink-tertiary)" }}>
        La carga se envía como multipart/form-data y conserva los valores si el backend devuelve error.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={mutation.isPending}
          style={primaryButtonStyle(mutation.isPending)}
        >
          {mutation.isPending ? "Creando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}

function SuccessSection({
  createdProduct,
  createdProductLabel,
}: {
  createdProduct: WorkerProducto;
  createdProductLabel: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          background: "var(--worker-inventory-bg)",
          border: "1px solid var(--worker-inventory-border)",
        }}
      >
        <p style={{ ...successStyle, fontSize: 13 }}>
          Producto creado: <strong>{createdProductLabel}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SummaryItem label="Precio" value={createdProduct.precio} />
        <SummaryItem label="Peso" value={createdProduct.peso} />
        <SummaryItem label="Medidas" value={createdProduct.medidas} />
        <SummaryItem label="Capacidad" value={createdProduct.capacidad ?? "—"} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Descripción</span>
        <div
          style={{
            padding: "12px 14px",
            background: "var(--worker-bench)",
            border: "1px solid var(--worker-border-soft)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--worker-ink-secondary)",
          }}
        >
          {createdProduct.descripcion}
        </div>
      </div>
    </div>
  );
}

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

  const previewUrls = useMemo(
    () => imagenes.map((file) => URL.createObjectURL(file)),
    [imagenes]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const isPending = varianteMutation.isPending || imagenMutation.isPending;

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
    setUploadProgress(0);

    try {
      await varianteMutation.mutateAsync({
        productoId: createdProduct.id,
        data: {
          color: Number(colorId),
          stock: Number(stock),
          activo,
          item: item.trim(),
        },
      });

      const totalImages = imagenes.length;
      for (let index = 0; index < totalImages; index += 1) {
        const formData = new FormData();
        formData.append("imagen", imagenes[index]);
        formData.append("orden", String(index));
        formData.append("es_principal", index === 0 && esPrincipal ? "true" : "false");
        await imagenMutation.mutateAsync({ productoId: createdProduct.id, data: formData });
        setUploadProgress(Math.round(((index + 1) / totalImages) * 100));
      }

      setSuccess("Variante creada correctamente. Cerrando…");
      onCompleted();
    } catch (error) {
      setSubmitError(parseInlineApiError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 8,
          background: "var(--worker-bench)",
          border: "1px solid var(--worker-border-soft)",
          fontSize: 13,
          color: "var(--worker-ink-secondary)",
        }}
      >
        Producto base: <strong style={{ color: "var(--worker-ink)" }}>{createdProduct.nombre}</strong>
      </div>

      <FormField label="Color" error={fieldErrors.colorId}>
        <select
          autoFocus
          value={colorId}
          onChange={(event) => {
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
        <FormField label="No. Item (SKU)" error={fieldErrors.item}>
          <input
            type="text"
            value={item}
            onChange={(event) => {
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
            value={stock}
            onChange={(event) => {
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
          gap: 8,
          alignItems: "center",
          fontSize: 13,
          color: "var(--worker-ink-secondary)",
        }}
      >
        <input
          type="checkbox"
          checked={activo}
          onChange={(event) => setActivo(event.target.checked)}
        />
        Activo
      </label>

      <FormField label="Imágenes (opcional)">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setImagenes(Array.from(event.target.files ?? []))}
          style={{ fontSize: 13, color: "var(--worker-ink-secondary)" }}
        />
      </FormField>

      {imagenes.length > 0 && (
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 13,
            color: "var(--worker-ink-secondary)",
          }}
        >
          <input
            type="checkbox"
            checked={esPrincipal}
            onChange={(event) => setEsPrincipal(event.target.checked)}
          />
          Primera imagen como principal
        </label>
      )}

      {imagenes.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {previewUrls.map((previewUrl, index) => (
            <img
              key={previewUrl}
              src={previewUrl}
              alt={`Vista previa ${index + 1}`}
              style={{
                width: 52,
                height: 52,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid var(--worker-border)",
              }}
            />
          ))}
        </div>
      )}

      {imagenMutation.isPending && uploadProgress > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "var(--worker-bench)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${uploadProgress}%`,
                background: "var(--worker-rail)",
                borderRadius: 2,
                transition: "width 0.2s ease",
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--worker-ink-tertiary)" }}>
            Subiendo imágenes… {uploadProgress}%
          </p>
        </div>
      )}

      {submitError && <p style={errorStyle}>{submitError}</p>}
      {success && <p style={successStyle}>{success}</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={isPending} style={primaryButtonStyle(isPending)}>
          {isPending ? "Guardando…" : "Guardar variante"}
        </button>
      </div>
    </form>
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
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={labelStyle}>{required ? `${label} *` : label}</label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--worker-bench)",
          border: "1px solid var(--worker-border-soft)",
          fontSize: 13,
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind: "primary" | "secondary";
}) {
  const style = kind === "primary"
    ? primaryButtonStyle(disabled)
    : secondaryButtonStyle(disabled);

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    background: disabled ? "var(--worker-ink-muted)" : "var(--worker-rail)",
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
}

function secondaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 500,
    color: disabled ? "var(--worker-ink-muted)" : "var(--worker-ink-secondary)",
    background: "var(--worker-bench)",
    border: "1px solid var(--worker-border)",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
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
