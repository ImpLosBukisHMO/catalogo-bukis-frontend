import API from "../api";

export async function getProducts() {
  const res = await API.get("/api/productos/");
  const data = res.data;
  // Aseguramos la extracción del arreglo sin importar el wrapper
  const items = Array.isArray(data) ? data : (data?.datos || data?.results || []);
  return items;
}

export async function getProductById(id: string | number) {
  const res = await API.get(`/api/productos/${id}/`);
  const data = res.data;
  return data?.datos || data;
}

export type ProductImage = {
  id: number;
  producto: number;
  variante: number | null;
  imagen: string;
  orden: number;
  es_principal: boolean;
  created_at: string;
  updated_at: string;
};

export async function getProductImages(params: {
  producto?: number;
  variante?: number;
}): Promise<ProductImage[]> {
  const qs = new URLSearchParams();
  if (params.producto !== undefined) qs.set("producto", String(params.producto));
  if (params.variante !== undefined) qs.set("variante", String(params.variante));

  const res = await API.get(`/api/productos-imagenes/?${qs.toString()}`);
  return res.data;
}
