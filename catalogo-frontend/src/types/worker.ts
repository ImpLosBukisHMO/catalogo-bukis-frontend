export type Categoria = {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
};

export type Color = {
  id: number;
  nombre: string;
  hex: string;
  created_at: string;
  updated_at: string;
};

export type Producto = {
  id: number;
  nombre: string;
  item: string;
  imagen: string;
  descripcion: string;
  precio: string;
  peso: string;
  medidas: string;
  capacidad: string | null;
  categoria: number;
  created_at: string;
  updated_at: string;
};

export type ProductoMini = {
  id: number;
  nombre: string;
  imagen: string;
  precio: string;
  categoria: number;
};

export type ProductoVariante = {
  id: number;
  producto: ProductoMini;
  color: { id: number; nombre: string; hex: string };
  stock: number;
  activo: boolean;
  disponible: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductoImagen = {
  id: number;
  producto: number;
  variante: number | null;
  imagen: string;
  orden: number;
  es_principal: boolean;
  created_at: string;
  updated_at: string;
};
