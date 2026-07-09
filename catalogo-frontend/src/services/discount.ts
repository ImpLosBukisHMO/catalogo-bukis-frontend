import API from "../api";
import type { Discount } from "../types/descuento";
import { normalizeResponse } from "../components/pages/responseNormalizer";

export async function getDiscounts() {
    const res = await API.get("/api/descuentos/")
    let norm = normalizeResponse<Discount>(res.data);
    const formatted = norm.map((val: Discount) => {
      val.fecha_inicio = new Date(val.fecha_inicio);
      val.fecha_fin = new Date(val.fecha_fin);
      return val;
    });
    return formatted; 
}

export async function getDiscountById(id: string | number) {
  const res = await API.get(`/api/descuentos/${id}/`);
  const data = res.data;
  return data?.datos || data;
}