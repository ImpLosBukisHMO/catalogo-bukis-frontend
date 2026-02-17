export type CartItemVM = {
  id: number;           // id del carrito item
  variante?: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
};

export type CartVM = {
  id: number;
  subtotal: number;
  items: CartItemVM[];
};