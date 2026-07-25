import type { Discount } from "./descuento";

export type Product = {
  id: number;
  nombre: string;
  imagen: string | null;
  descripcion: string;
  precio: string;
  peso: string;
  medidas: string;
  capacidad: string;
  categoria: {
    id: number;
    nombre: string;
    descuento?: Discount | null;
  } | null;
  descuento_especial?: Discount | null;
  created_at: string;
  updated_at: string;
  disponible: boolean;
};

export type ProductCardVM = {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
  categoria: {
    id: number;
    nombre: string;
    descuento?: Discount | null;
  } | null;
  descuento_especial?: Discount | null;
};

export type ColorMini = {
  id: number;
  nombre: string;
  hex: string;
};

export type Variant = {
  id: number;
  item: string;
  codigo_barras: string;
  color: ColorMini;
  precio: string;
  stock: number;
  activo: boolean;
  disponible: boolean;
  producto?: {
    id: number;
    nombre: string;
    imagen: string | null;
    precio: string;
    categoria: {
      id: number;
      nombre: string;
      descuento_general?: Discount | null;
    } | null;
    descuento_especial?: Discount | null;
  };
};

export type ProductDetail = Product & {
  variantes: Variant[];
};
