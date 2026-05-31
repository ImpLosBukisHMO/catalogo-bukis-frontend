import API from "../api";

export async function getProducts() {
  const res = await API.get("/api/productos/");
  return res.data;
}

export async function getProductById(id: string | number) {
  const res = await API.get(`/api/productos/${id}/`);
  return res.data;
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
