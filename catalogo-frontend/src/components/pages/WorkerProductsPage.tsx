import { useEffect, useMemo, useState } from "react";
import Table from "../elements/Table";
import { getWorkerVariants } from "../../services/worker";
import type { WorkerVariant } from "../../types/worker";

export default function WorkerProductsPage() {
  const [variants, setVariants] = useState<WorkerVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    getWorkerVariants()
      .then(setVariants)
      .catch((err) => {
        console.error("Error loading variants:", err);
        setVariants([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.producto.categoria));
    return Array.from(set).sort();
  }, [variants]);

  const filtered = useMemo(() => {
    return variants.filter((v) => {
      const matchName = v.producto.nombre
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "ALL" ||
        v.producto.categoria === categoryFilter;

      return matchName && matchCategory;
    });
  }, [variants, search, categoryFilter]);

  const columns = [
    {
      header: "Producto",
      render: (v: WorkerVariant) => v.producto.nombre,
    },
    {
      header: "Categoría",
      render: (v: WorkerVariant) => v.producto.categoria,
    },
    {
      header: "Color",
      render: (v: WorkerVariant) => (
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: v.color.hex,
              border: "1px solid #ccc",
            }}
          />
          {v.color.nombre}
        </span>
      ),
    },
    {
      header: "Stock",
      render: (v: WorkerVariant) => v.stock,
    },
    {
      header: "Activo",
      render: (v: WorkerVariant) => (v.activo ? "Sí" : "No"),
    },
    {
      header: "Precio",
      render: (v: WorkerVariant) =>
        `$${Number(v.producto.precio).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <h2>Productos</h2>
      <p style={{ color: "#6b7280" }}>
        Inventario por variante
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          className="custom-input"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="custom-input"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando productos…</p>
      ) : (
        <Table columns={columns} data={filtered} />
      )}
    </div>
  );
}
