export type WorkerVariant = {
  variant_id: number;
  producto: {
    id: number;
    nombre: string;
    item: string;
    precio: string;
    categoria: string;
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
