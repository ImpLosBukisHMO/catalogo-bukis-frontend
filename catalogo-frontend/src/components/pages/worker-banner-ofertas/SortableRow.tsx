import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { BannerOfertaWorker } from "../../../types/bannerOferta";
import { BannerOfertaThumbnail } from "./BannerOfertaThumbnail";

type SortableRowProps = {
  banner: BannerOfertaWorker;
  disabled?: boolean;
  onToggleActive: (banner: BannerOfertaWorker) => void;
  onEdit: (banner: BannerOfertaWorker) => void;
  onDelete: (banner: BannerOfertaWorker) => void;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function SortableRow({
  banner,
  disabled = false,
  onToggleActive,
  onEdit,
  onDelete,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
    disabled,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
      : undefined,
    transition,
    background: isDragging ? "var(--worker-bench)" : "transparent",
  };

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        borderBottom: "1px solid var(--worker-border-soft)",
      }}
    >
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        <button
          type="button"
          aria-label={`Reordenar banner ${banner.id}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
          style={{
            background: "none",
            border: "none",
            color: "var(--worker-ink-tertiary)",
            cursor: disabled ? "not-allowed" : "grab",
          }}
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BannerOfertaThumbnail banner={banner} />
        </div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        {banner.tipo === "video" ? "Video" : "Imagen"}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        {banner.orden}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer" }}>
          <input
            type="checkbox"
            checked={banner.activo}
            disabled={disabled}
            onChange={() => onToggleActive(banner)}
            style={{ width: 16, height: 16, cursor: disabled ? "not-allowed" : "pointer" }}
          />
          <span>{banner.activo ? "Sí" : "No"}</span>
        </label>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        {formatDate(banner.fecha_inicio)}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        {formatDate(banner.fecha_fin)}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => onEdit(banner)}
            disabled={disabled}
            title="Editar banner"
            style={{ background: "none", border: "none", color: "var(--worker-ink-tertiary)", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(banner)}
            disabled={disabled}
            title="Eliminar banner"
            style={{ background: "none", border: "none", color: "var(--worker-error-fg)", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
