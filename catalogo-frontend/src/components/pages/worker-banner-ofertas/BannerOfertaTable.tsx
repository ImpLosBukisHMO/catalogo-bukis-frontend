import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Announcements } from "@dnd-kit/core/dist/components/Accessibility";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { BannerOfertaWorker } from "../../../types/bannerOferta";
import { SortableRow } from "./SortableRow";

type BannerOfertaTableProps = {
  items: BannerOfertaWorker[];
  disabled?: boolean;
  onToggleActive: (banner: BannerOfertaWorker) => void;
  onEdit: (banner: BannerOfertaWorker) => void;
  onDelete: (banner: BannerOfertaWorker) => void;
  onReorder: (rows: Array<{ id: number; orden: number }>) => Promise<void>;
};

export function BannerOfertaTable({
  items,
  disabled = false,
  onToggleActive,
  onEdit,
  onDelete,
  onReorder,
}: BannerOfertaTableProps) {
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Se empezó a mover el banner ${active.id}.`,
    onDragOver: ({ over }) => over ? `El banner está sobre la posición ${over.id}.` : undefined,
    onDragEnd: ({ over }) => over ? `El banner se soltó cerca de la posición ${over.id}.` : "Movimiento cancelado.",
    onDragCancel: () => "Movimiento cancelado.",
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      orden: index + 1,
    }));

    const changedRows = reordered
      .filter((item) => {
        const original = items.find((candidate) => candidate.id === item.id);
        return original?.orden !== item.orden;
      })
      .map((item) => ({ id: item.id, orden: item.orden }));

    if (changedRows.length === 0) return;
    await onReorder(changedRows);
  };

  return (
    <div className="max-h-[calc(100vh-180px)]" style={{ overflowX: "auto", overflowY: "auto" }}>
      {/* Keyboard reorder: Space grabs, Arrow keys move, Space drops, Escape cancels. */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragEnd={(event) => {
          void handleDragEnd(event);
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr className="sticky top-0 z-10" style={{ background: "#1e293b", color: "#fff" }}>
              {["Mover", "Thumbnail", "Tipo", "Orden", "Activo", "Fecha inicio", "Fecha fin", "Acciones"].map((label) => (
                <th key={label} style={{ padding: "10px 14px", whiteSpace: "nowrap", fontWeight: 600, fontSize: 13, textAlign: "center" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {items.map((banner) => (
                <SortableRow
                  key={banner.id}
                  banner={banner}
                  disabled={disabled}
                  onToggleActive={onToggleActive}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
