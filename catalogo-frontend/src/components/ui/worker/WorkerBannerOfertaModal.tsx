import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent, ReactNode } from "react";
import axios from "axios";
import type { BannerOfertaTipo, BannerOfertaWorker } from "../../../types/bannerOferta";
import { useCreateBannerOferta, useUpdateBannerOferta } from "../../../queries/workerBannerOfertas";
import { resolveImageUrl } from "../../../utils/images";
import {
  WorkerDialogBody,
  WorkerDialogContent,
  WorkerDialogDescription,
  WorkerDialogFooter,
  WorkerDialogHeader,
  WorkerDialogRoot,
  WorkerDialogTitle,
} from "./WorkerDialog";
import { InlineNotice, ModalButton } from "./WorkerCreateProductModal";

type WorkerBannerOfertaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: BannerOfertaWorker | null;
  activeCount: number;
};

type FieldErrors = Partial<Record<"archivo" | "tipo" | "orden" | "fecha_inicio" | "fecha_fin", string>>;

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
};

const allowedImageExtensions = ["jpg", "jpeg", "png", "webp"];
const allowedVideoExtensions = ["mp4", "webm"];

function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function inferTipoFromFile(file: File): BannerOfertaTipo {
  return file.type.startsWith("video/") ? "video" : "imagen";
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateFile(file: File | null) {
  if (!file) return undefined;

  const tipo = inferTipoFromFile(file);
  const extension = getFileExtension(file.name);

  if (tipo === "imagen") {
    if (!allowedImageExtensions.includes(extension)) {
      return "El tipo de archivo no está permitido";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "La imagen no puede superar los 5MB";
    }
  }

  if (tipo === "video") {
    if (!allowedVideoExtensions.includes(extension)) {
      return "El tipo de archivo no está permitido";
    }

    if (file.size > 20 * 1024 * 1024) {
      return "El video no puede superar los 20MB";
    }
  }

  return undefined;
}

function readApiErrors(error: unknown) {
  const fieldErrors: FieldErrors = {};
  let submitError: string | null = null;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        const normalized = Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : "";

        if (["archivo", "tipo", "orden", "fecha_inicio", "fecha_fin"].includes(key)) {
          fieldErrors[key as keyof FieldErrors] = normalized;
        } else if (!submitError && normalized) {
          submitError = normalized;
        }
      }
    }

    if (!submitError) {
      submitError = error.message;
    }
  } else if (error instanceof Error) {
    submitError = error.message;
  }

  return { fieldErrors, submitError: submitError ?? "No se pudo guardar el banner." };
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error ? <p style={{ margin: 0, fontSize: 12, color: "var(--worker-error-fg)" }}>{error}</p> : null}
    </div>
  );
}

export function WorkerBannerOfertaModal({
  open,
  onOpenChange,
  banner,
  activeCount,
}: WorkerBannerOfertaModalProps) {
  const createMutation = useCreateBannerOferta();
  const updateMutation = useUpdateBannerOferta();
  const isEditing = Boolean(banner);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [tipo, setTipo] = useState<BannerOfertaTipo>(banner?.tipo ?? "imagen");
  const [orden, setOrden] = useState(String(banner?.orden ?? 1));
  const [activo, setActivo] = useState<boolean>(banner?.activo ?? true);
  const [fechaInicio, setFechaInicio] = useState(toDateInput(banner?.fecha_inicio));
  const [fechaFin, setFechaFin] = useState(toDateInput(banner?.fecha_fin));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (archivo) {
      return URL.createObjectURL(archivo);
    }

    return resolveImageUrl(banner?.archivo) ?? null;
  }, [archivo, banner?.archivo]);

  useEffect(() => {
    return () => {
      if (archivo && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [archivo, previewUrl]);

  const activeLimitWarning = activeCount >= 10 && activo && !banner?.activo;

  const validate = () => {
    const nextFieldErrors: FieldErrors = {};
    const fileError = validateFile(archivo);

    if (!isEditing && !archivo) {
      nextFieldErrors.archivo = "Selecciona un archivo de imagen o video.";
    }

    if (fileError) {
      nextFieldErrors.archivo = fileError;
    }

    if (!orden.trim() || Number(orden) < 1) {
      nextFieldErrors.orden = "El orden debe ser mayor o igual a 1.";
    }

    if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      nextFieldErrors.fecha_fin = "La fecha de fin debe ser posterior a la fecha de inicio.";
    }

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setArchivo(nextFile);
    setSubmitError(null);

    if (!nextFile) {
      setFieldErrors((current) => ({ ...current, archivo: undefined }));
      return;
    }

    setTipo(inferTipoFromFile(nextFile));
    setFieldErrors((current) => ({ ...current, archivo: validateFile(nextFile) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      if (!isEditing) {
        const formData = new FormData();
        formData.append("tipo", tipo);
        formData.append("orden", orden);
        formData.append("activo", activo ? "true" : "false");
        if (fechaInicio) formData.append("fecha_inicio", fechaInicio);
        if (fechaFin) formData.append("fecha_fin", fechaFin);
        if (archivo) formData.append("archivo", archivo);

        await createMutation.mutateAsync(formData);
      } else if (banner) {
        if (archivo) {
          const formData = new FormData();
          formData.append("tipo", tipo);
          formData.append("orden", orden);
          formData.append("activo", activo ? "true" : "false");
          formData.append("archivo", archivo);
          if (fechaInicio) formData.append("fecha_inicio", fechaInicio);
          if (fechaFin) formData.append("fecha_fin", fechaFin);

          await updateMutation.mutateAsync({ kind: "file", id: banner.id, data: formData });
        } else {
          await updateMutation.mutateAsync({
            kind: "meta",
            id: banner.id,
            data: {
              tipo,
              orden: Number(orden),
              activo,
              fecha_inicio: fechaInicio || null,
              fecha_fin: fechaFin || null,
            },
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      const parsed = readApiErrors(error);
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.submitError);
    }
  };

  const summaryErrors = Object.values(fieldErrors).filter(Boolean) as string[];

  return (
    <WorkerDialogRoot open={open} onOpenChange={(nextOpen) => {
      if (isPending) return;
      onOpenChange(nextOpen);
    }}>
      <WorkerDialogContent size="lg" layout="adaptive">
        <WorkerDialogHeader>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <WorkerDialogTitle>{isEditing ? "Editar banner" : "Crear banner"}</WorkerDialogTitle>
              <WorkerDialogDescription>
                Sube una imagen o video, revisa la vista previa y ajusta las fechas antes de publicar.
              </WorkerDialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              style={{
                background: "none",
                border: "1px solid var(--worker-border-soft)",
                fontSize: 20,
                lineHeight: 1,
                color: isPending ? "var(--worker-ink-muted)" : "var(--worker-ink-tertiary)",
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
          <form id="worker-banner-oferta-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {summaryErrors.length > 0 && (
              <InlineNotice tone="error">
                {summaryErrors.join(" · ")}
              </InlineNotice>
            )}

            {submitError ? <InlineNotice tone="critical">{submitError}</InlineNotice> : null}
            {activeLimitWarning ? <InlineNotice tone="info">Se alcanzó el límite de 10 banners activos</InlineNotice> : null}

            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <FormField label="Tipo" error={fieldErrors.tipo}>
                <select value={tipo} onChange={(event) => setTipo(event.target.value as BannerOfertaTipo)} style={inputStyle}>
                  <option value="imagen">Imagen</option>
                  <option value="video">Video</option>
                </select>
              </FormField>

              <FormField label="Orden" error={fieldErrors.orden}>
                <input
                  type="number"
                  min="1"
                  value={orden}
                  onChange={(event) => setOrden(event.target.value)}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <FormField label="Fecha de inicio" error={fieldErrors.fecha_inicio}>
                <input type="datetime-local" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} style={inputStyle} />
              </FormField>

              <FormField label="Fecha de fin" error={fieldErrors.fecha_fin}>
                <input type="datetime-local" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} style={inputStyle} />
              </FormField>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--worker-ink-secondary)" }}>
              <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} />
              {activo ? "Banner activo" : "Banner inactivo"}
            </label>

            <FormField label="Archivo" error={fieldErrors.archivo}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                style={{ ...inputStyle, padding: 10 }}
              />
              <p style={{ margin: 0, fontSize: 12, color: "var(--worker-ink-tertiary)" }}>
                Imágenes JPG, PNG o WebP hasta 5MB. Videos MP4 o WebM hasta 20MB.
              </p>
            </FormField>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={labelStyle}>Vista previa</span>
              {previewUrl ? (
                tipo === "video" ? (
                  <video src={previewUrl} controls muted playsInline style={{ width: "100%", maxHeight: 280, borderRadius: 12, background: "#000" }} />
                ) : (
                  <img src={previewUrl} alt="Vista previa del banner" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12 }} />
                )
              ) : (
                <div style={{ padding: 18, borderRadius: 12, background: "var(--worker-bench)", color: "var(--worker-ink-tertiary)" }}>
                  Selecciona un archivo para ver la vista previa.
                </div>
              )}
            </div>
          </form>
        </WorkerDialogBody>

        <WorkerDialogFooter>
          <ModalButton kind="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </ModalButton>
          <ModalButton kind="primary" type="submit" form="worker-banner-oferta-form" disabled={isPending || summaryErrors.length > 0}>
            {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear banner"}
          </ModalButton>
        </WorkerDialogFooter>
      </WorkerDialogContent>
    </WorkerDialogRoot>
  );
}
