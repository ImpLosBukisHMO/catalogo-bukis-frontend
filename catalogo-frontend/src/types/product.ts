export type Product = {
  id: number;
  nombre: string;
  item: string;
  imagen: string | null;
  descripcion: string;
  precio: string;
  peso: string;
  medidas: string;
  capacidad: string;
  categorias: number[];
  created_at: string;
  updated_at: string;
  disponible: boolean;
};

export type ProductCardVM = {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
};

export type ColorMini = {
  id: number;
  nombre: string;
  hex: string;
};

export type Variant = {
  id: number;
  item: string;
  color: ColorMini;
  precio: string;
  stock: number;
  activo: boolean;
  disponible: boolean;
};

export type ProductDetail = Product & {
  variantes: Variant[];
};
