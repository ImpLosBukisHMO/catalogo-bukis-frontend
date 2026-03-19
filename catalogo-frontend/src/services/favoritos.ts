import type { FavoritoVariante } from "../types/favoritos";
import API from "../api";

export async function getFavoritos(): Promise<FavoritoVariante[]> {
  const res = await API.get("/api/productos-favoritos/");
  return res.data;
}

export async function addFavorito(varianteId: number): Promise<FavoritoVariante> {
  const res = await API.post("/api/productos-favoritos/", { variante_id: varianteId });
  return res.data;
}

export async function removeFavorito(favoritoId: number): Promise<void> {
  await API.delete(`/api/productos-favoritos/${favoritoId}/`);
}
