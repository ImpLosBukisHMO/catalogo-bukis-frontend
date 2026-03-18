type Category = {
  id: number;
  nombre: string;
};

type Props = {
  search: string;
  onSearchChange: (v: string) => void;

  categories: Category[];
  selectedCategory: number | "all";
  onCategoryChange: (v: number | "all") => void;
};

const FilterBar = ({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: Props) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar producto por nombre"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #d0d5dd",
        }}
      />

      {/* Categorías */}
      <select
        value={selectedCategory}
        onChange={(e) =>
          onCategoryChange(
            e.target.value === "all" ? "all" : Number(e.target.value)
          )
        }
        style={{
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #d0d5dd",
          minWidth: "220px",
        }}
      >
        <option value="all">Todas las categorías</option>
        {categories
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
      </select>
    </div>
  );
};

export default FilterBar;
