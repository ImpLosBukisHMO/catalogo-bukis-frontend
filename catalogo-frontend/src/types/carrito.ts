export type CarritoItem = {
  id: number;
  variante_id: number;
  cantidad: number;
  producto_id: number;
  producto_nombre: string;
  color_nombre: string;
  color_hex: string;
  precio_unitario: string;
  subtotal_linea: number;
  imagen: string | null;
};

export type CarritoResponse = {
  id: number;
  estado: "ACTIVE" | "CHECKED_OUT" | "ABANDONED";
  subtotal: number;
  items: CarritoItem[];
};
