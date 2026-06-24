export type WorkerVariant = {
  variant_id: number;
  item: string;
  precio: number;
  producto: {
    id: number;
    nombre: string;
    precio: string;
    categorias: number[];
  };
  color: {
    id: number;
    nombre: string;
    hex: string;
  };
  stock: number;
  activo: boolean;
  imagen_principal: string | null;
};

export type WorkerPedidoCliente = {
  id: number;
  nombre: string;
  correo: string;
};

export type WorkerPedido = {
  id: number;
  public_id: string;
  cliente: WorkerPedidoCliente;
  estado: string;
  precio_total: string;
  items_count: number;
  created_at: string;
};

export type WorkerPedidoItem = {
  cantidad: number;
  nombre: string;
  item: string;
  color: string;
  color_hex: string;
  precio_unitario: string;
  subtotal: string;
  imagen: string;
};

export type WorkerPedidoDetalle = {
  id: number;
  public_id: string;
  cliente: {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
  };
  estado: string;
  precio_total: string;
  subtotal_snapshot: string;
  nota_cliente: string | null;
  nota_worker: string | null;
  denegado_razon: string | null;
  aprobado_eta: string | null;
  items: WorkerPedidoItem[];
  created_at: string;
};

export type WorkerProducto = {
  id: number;
  nombre: string;
  imagen: string;
  descripcion: string;
  precio: string;
  peso: string;
  medidas: string;
  capacidad: string | null;
  disponible: boolean;
  categorias: number[];
  created_at: string;
  updated_at: string;
  variantes?: WorkerVariant[];
};

export const ESTADOS_PEDIDO = [
  "PENDING",
  "APPROVED",
  "DENIED",
  "READY",
  "SHIPPED",
  "COMPLETED",
  "CANCELED",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADO_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  DENIED: "Denegado",
  READY: "Listo",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

export const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  PENDING: ["APPROVED", "DENIED"],
  APPROVED: ["READY"],
  READY: ["SHIPPED"],
  SHIPPED: ["COMPLETED"],
  DENIED: [],
  COMPLETED: [],
  CANCELED: [],
};
