import type { Categoria, Color, Producto, ProductoVariante, ProductoImagen } from "../types/worker";

const API_BASE = "http://127.0.0.1:8000/api";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return (await res.json()) as T;
}

// Categorias
export async function getCategorias(): Promise<Categoria[]> {
  // tu endpoint regresa { datos: [...] }
  const data = await request<{ datos: Categoria[] }>("/categorias/");
  return data.datos ?? [];
}

export async function createCategoria(nombre: string) {
  return request("/categorias/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre }),
  });
}

// Colores
export async function getColores(): Promise<Color[]> {
  return request<Color[]>("/colores/");
}

export async function createColor(nombre: string, hex: string): Promise<Color> {
  return request<Color>("/colores/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, hex }),
  });
}

// Productos
export async function getProductos(): Promise<Producto[]> {
  return request<Producto[]>("/productos/");
}

export async function createProducto(form: {
  nombre: string;
  item: string;
  descripcion: string;
  precio: string;
  peso: string;
  medidas: string;
  capacidad?: string;
  categoria: number;
  imagenFile: File;
}): Promise<Producto> {
  const fd = new FormData();
  fd.append("nombre", form.nombre);
  fd.append("item", form.item);
  fd.append("descripcion", form.descripcion);
  fd.append("precio", form.precio);
  fd.append("peso", form.peso);
  fd.append("medidas", form.medidas);
  fd.append("capacidad", form.capacidad ?? "");
  fd.append("categoria", String(form.categoria));
  fd.append("imagen", form.imagenFile);

  return request<Producto>("/productos/", { method: "POST", body: fd });
}

// Variantes
export async function getVariantes(productoId?: number): Promise<ProductoVariante[]> {
  const qs = productoId ? `?producto=${productoId}` : "";
  return request<ProductoVariante[]>(`/producto-variantes/${qs}`);
}

export async function createVariante(input: {
  producto_id: number;
  color_id: number;
  stock: number;
  activo: boolean;
}): Promise<ProductoVariante> {
  return request<ProductoVariante>("/producto-variantes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Imagenes de galeria
export async function getImagenes(params?: { producto?: number; variante?: number }): Promise<ProductoImagen[]> {
  const qs = new URLSearchParams();
  if (params?.producto) qs.set("producto", String(params.producto));
  if (params?.variante) qs.set("variante", String(params.variante));
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return request<ProductoImagen[]>(`/productos-imagenes/${tail}`);
}

export async function uploadImagenGaleria(form: {
  producto_id: number;
  variante_id?: number | null;
  orden: number;
  es_principal: boolean;
  imagenFile: File;
}): Promise<ProductoImagen> {
  const fd = new FormData();
  fd.append("producto_id", String(form.producto_id));
  if (form.variante_id !== undefined) {
    fd.append("variante_id", form.variante_id === null ? "" : String(form.variante_id));
  }
  fd.append("orden", String(form.orden));
  fd.append("es_principal", form.es_principal ? "true" : "false");
  fd.append("imagen", form.imagenFile);

  return request<ProductoImagen>("/productos-imagenes/", { method: "POST", body: fd });
}
