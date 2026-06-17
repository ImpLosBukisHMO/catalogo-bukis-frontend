import type { CarritoResponse } from "../types/carrito";
import API from "../api";

export async function getCarritoActual(): Promise<CarritoResponse> {
  const res = await API.get("/api/carrito/");
  return res.data?.datos || res.data;
}

export async function addItem(variante_id: number, cantidad: number) {
  const res = await API.post("/api/carrito/items/", { variante_id, cantidad });
  return res.data;
}

export async function updateItemCantidad(item_id: number, cantidad: number) {
  const res = await API.patch(`/api/carrito/items/${item_id}/`, { cantidad });
  return res.data;
}

export async function deleteItem(item_id: number) {
  await API.delete(`/api/carrito/items/${item_id}/`);
  return true;
}

export async function checkoutCart() {
  const res = await API.post("/api/carrito/checkout/");
  return res.data;
}
