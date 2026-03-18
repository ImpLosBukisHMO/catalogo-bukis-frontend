import type { CartVM, CartItemVM } from "../types/cart";
import API from "../api";



const mapItem = (item: any): CartItemVM => ({
  id: item.id,
  nombre: item.producto_nombre,
  variante: item.color_nombre,
  precio: Number(item.precio_unitario),
  cantidad: item.cantidad,
  imagen: item.imagen,
});

export async function getCart(): Promise<CartVM> {
  const res = await API.get("api/carrito/");
  const data = res.data;

  return {
    id: data.id,
    subtotal: Number(data.subtotal),
    items: data.items.map(mapItem),
  };
}

export async function addItem(itemId: number, cantidad = 1) {
  const res = await API.post("/api/carrito/items/", {
    variante_id: itemId,
    cantidad,
  });

  return res.data;
}



export async function updateItem(itemId: number, cantidad: number) {
  const res = await API.patch(`/api/carrito/items/${itemId}/`, {
    cantidad,
  });

  return res.data;
}

export async function removeItem(itemId: number) {
  const res = await API.delete(`/api/carrito/items/${itemId}/`);

  return res.data;
}

export async function checkoutCart() {
  const res = await API.post(`/api/carrito/checkout/`);

  return res.data;
}
