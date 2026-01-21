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
