import { useState } from "react";

type Props = {
  stock: number;
  disponible: boolean;
  precio: number;

  onSave: (data: {
    stock: number;
    disponible: boolean;
    precio: number;
  }) => void;

  onDelete: () => void;
};

const VariantActions = ({
  stock,
  disponible,
  precio,
  onSave,
  onDelete,
}: Props) => {
  const [editing, setEditing] = useState(false);

  const [localStock, setLocalStock] = useState(stock);
  const [localDisponible, setLocalDisponible] = useState(disponible);
  const [localPrecio, setLocalPrecio] = useState(precio);

  /* =========================
     Vista normal
     ========================= */
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Editar variante"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#667085",
        }}
      >
        ✏️
      </button>
    );
  }

  /* =========================
     Vista edición
     ========================= */
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <input
        type="number"
        value={localStock}
        onChange={(e) => setLocalStock(Number(e.target.value))}
        style={{ width: "70px" }}
      />

      <select
        value={localDisponible ? "1" : "0"}
        onChange={(e) => setLocalDisponible(e.target.value === "1")}
      >
        <option value="1">Sí</option>
        <option value="0">No</option>
      </select>

      <input
        type="number"
        value={localPrecio}
        onChange={(e) => setLocalPrecio(Number(e.target.value))}
        style={{ width: "90px" }}
      />

      <button
        onClick={() => {
          onSave({
            stock: localStock,
            disponible: localDisponible,
            precio: localPrecio,
          });
          setEditing(false);
        }}
        style={{ cursor: "pointer" }}
      >
        💾
      </button>

      <button
        onClick={() => {
          if (
            confirm(
              "¿Estás seguro de que deseas eliminar esta variante?"
            )
          ) {
            onDelete();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        🗑
      </button>

      <button
        onClick={() => setEditing(false)}
        style={{ cursor: "pointer" }}
      >
        ✖
      </button>
    </div>
  );
};

export default VariantActions;
