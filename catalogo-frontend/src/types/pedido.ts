export type PedidoItem = {
  id: number;
  cantidad: number;
  producto_nombre_snapshot: string;
  producto_item_snapshot: string;
  color_nombre_snapshot: string;
  color_hex_snapshot: string;
  precio_unitario_snapshot: string;
  subtotal_linea_snapshot: string;
  imagen_principal_snapshot: string;
};

export type PedidoDetalle = {
  id: number;
  public_id: string;
  estado: string;
  precio_total: string;
  subtotal_snapshot: string;
  nota_cliente: string | null;
  nota_worker: string | null;
  denegado_razon: string | null;
  aprobado_eta: string | null;
  created_at: string;
  items: PedidoItem[];
};

export type PedidoResumen = {
  id: number;
  public_id: string;
  estado: string;
  precio_total: string;
  created_at: string;
  items_count: number;
};
