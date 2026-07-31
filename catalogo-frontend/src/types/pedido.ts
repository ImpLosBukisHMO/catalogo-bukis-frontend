import type { Usuario } from "../services/user";

export type PedidoItem = {
  id: number;
  cantidad: number;
  producto_nombre_snapshot: string;
  producto_item_snapshot: string;
  color_nombre_snapshot: string;
  color_hex_snapshot: string;
  precio_unitario_snapshot: string;
  descuento_porcentaje_snapshot: string; // viene como "15.00" o "0.00"
  subtotal_linea_snapshot: string;
  imagen_principal_snapshot: string;
};

export type PedidoDetalle = {
  id: number;
  public_id: string;
  folio: string;
  estado: string;
  precio_total: string;
  subtotal_snapshot: string;
  nota_cliente: string | null;
  nota_worker: string | null;
  denegado_razon: string | null;
  aprobado_eta: string | null;
  /** ISO 8601 – plazo límite para subir el comprobante (solo cuando estado=APPROVED) */
  comprobante_deadline: string | null;
  comprobante_pago_subido: boolean;
  comprobante_pago_nombre: string | null;
  comprobante_pago_url: string | null;
  created_at: string;
  items: PedidoItem[];
  cliente: Usuario
};

export type PedidoResumen = {
  id: number;
  public_id: string;
  folio: string;
  estado: string;
  precio_total: string;
  created_at: string;
  items_count: number;
  /** ISO 8601 – plazo límite para subir el comprobante (solo cuando estado=APPROVED) */
  comprobante_deadline: string | null;
  comprobante_pago_subido: boolean;
};
