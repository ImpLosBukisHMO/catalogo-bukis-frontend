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
  categoria: number;
  created_at: string;
  updated_at: string;
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
  color: ColorMini;
  stock: number;
  activo: boolean;
  disponible: boolean;
};

export type ProductDetail = Product & {
  variantes: Variant[];
};