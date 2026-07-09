import API from "../api";

export async function getCategories() {
  const res = await API.get("/api/categorias/", {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al cargar categorías (${res.status}).`);
  }

  return res.data?.datos;
}

export async function getCategoryById(id: string | number | null) {
  const res = await API.get(`/api/categorias/${id}/`, {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al cargar categoría (${res.status}).`);
  }

  return res.data;
}
