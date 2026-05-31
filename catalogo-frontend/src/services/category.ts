import API from "../api";

export type Category = {
  id: number | null;
  nombre: string | null;
  updated_at: string | null;
  created_at: string | null;
}

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
