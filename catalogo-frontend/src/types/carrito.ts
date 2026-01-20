// src/types/carrito.ts
export type CarritoItem = {
  id: number;
  variante_id: number;
  cantidad: number;

  producto_id: number;
  producto_nombre: string;

  // si no viene, lo ponemos opcional
  descripcion_snapshot?: string;
  descripcion?: string;

  color_nombre: string;
  color_hex: string;

  precio_unitario: string; // viene como "699.00"
  subtotal_linea: number;  // viene como 699.0
  imagen?: string;         // viene como "/media/..."
};

export type CarritoResponse = {
  id: number;
  estado: string;
  subtotal: number;
  items: CarritoItem[];
};
