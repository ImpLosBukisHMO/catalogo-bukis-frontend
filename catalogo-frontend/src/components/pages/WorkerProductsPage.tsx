import { useEffect, useMemo, useState } from "react";
import Table from "../elements/Table";
import { getProducts } from "../../services/product";
import type { Product, VariantRow } from "../../types/product";

export default function WorkerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  /* =========================
     Fetch
     ========================= */

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error("Error loading products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     Categorías únicas
     ========================= */

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoria?.nombre) {
        set.add(p.categoria.nombre);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  /* =========================
     Normalizar filas (ANTI-CRASH)
     ========================= */

  const rows: VariantRow[] = useMemo(() => {
    return products.flatMap((product) => {
      const variantes = product.variantes ?? [];

      // Si no hay variantes, NO rompe
      if (variantes.length === 0) return [];

      return variantes.map((variant) => ({
        id: variant.id,
        producto: product.nombre,
        categoria: product.categoria?.nombre ?? "Sin categoría",
        color: variant.color?.nombre ?? "—",
        stock: variant.stock,
        disponible: variant.disponible,
        precio: Number(product.precio),
      }));
    });
  }, [products]);

  /* =========================
     Filtros
     ========================= */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchName = r.producto
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "ALL" || r.categoria === categoryFilter;

      return matchName && matchCategory;
    });
  }, [rows, search, categoryFilter]);

  /* =========================
     Columns
     ========================= */

  const columns = [
    {
      header: "Producto",
      render: (r: VariantRow) => r.producto,
    },
    {
      header: "Categoría",
      render: (r: VariantRow) => r.categoria,
    },
    {
      header: "Color",
      render: (r: VariantRow) => r.color,
    },
    {
      header: "Stock",
      render: (r: VariantRow) => r.stock,
    },
    {
      header: "Disponible",
      render: (r: VariantRow) =>
        r.disponible ? "Sí" : "No",
    },
    {
      header: "Precio",
      render: (r: VariantRow) => `$${r.precio.toFixed(2)}`,
    },
  ];

  /* =========================
     Render
     ========================= */

  return (
    <div style={{ padding: 24 }}>
      <h2>Productos</h2>
      <p style={{ color: "#6b7280" }}>
        Gestión de inventario por variante
      </p>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          className="custom-input"
          placeholder="Buscar por nombre..."
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

      {/* Tabla */}
      {loading ? (
        <p>Cargando productos…</p>
      ) : (
        <Table columns={columns} data={filteredRows} />
      )}
    </div>
  );
}
