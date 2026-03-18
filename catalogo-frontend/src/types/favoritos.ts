export type FavoritoVariante = {
  id: number;
  variante: {
    id: number;
    item: string;
    stock: number;
    activo: boolean;
    nombre_producto: string;
    precio: string;
    color: { id: number; nombre: string; hex: string };
    imagen: string | null;
  };
};
