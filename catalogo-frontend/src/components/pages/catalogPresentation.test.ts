import { describe, expect, it } from "vitest";
import {
  applyLocalCatalogFilters,
  getCatalogResultsSummary,
} from "./catalogPresentation";
import type { Product } from "../../types/product";
import type { Discount } from "../../types/descuento";

function buildProduct(
  id: number,
  price: string, 
  category: {
    id: number;
    nombre: string;
    descuento?: Discount | null;
  } | null
): Product {
  return {
    id,
    nombre: `Producto ${id}`,
    imagen: null,
    descripcion: "",
    precio: price,
    peso: "1",
    medidas: "1x1",
    capacidad: "1",
    categoria: category,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    disponible: true,
  };
}

describe("catalogPresentation", () => {
  it("applies local category and price filters only to the current backend page items", () => {
    const products = [
      buildProduct(1, "10.00", { id: 1, nombre: "Categoría 1", descuento: null}),
      buildProduct(2, "25.00", { id: 2, nombre: "Categoría 2", descuento: null}),
      buildProduct(3, "40.00", { id: 3, nombre: "Categoría 3", descuento: null}),
    ];

    expect(
      applyLocalCatalogFilters(products, {
        categories: [1, 2, 3],
        minPrice: 15,
        maxPrice: 45,
      }),
    ).toEqual([products[1], products[2]]);
  });

  it("filters products by name ignoring case and diacritics when query is provided", () => {
    const products = [
      buildProduct(1, "10.00", { id: 1, nombre: "Categoría 1", descuento: null}),
      buildProduct(2, "20.00", { id: 1, nombre: "Categoría 1", descuento: null}),
      buildProduct(3, "30.00", { id: 1, nombre: "Categoría 1", descuento: null}),
    ];
    products[0].nombre = "Cámara de vigilancia";
    products[1].nombre = "Funda para camara";
    products[2].nombre = "Micrófono USB";

    expect(
      applyLocalCatalogFilters(products, {
        categories: [],
        minPrice: null,
        maxPrice: null,
        query: "cÁMaRa",
      }),
    ).toEqual([products[0], products[1]]);
  });

  it("returns the approved results summary copy for zero, singular, and plural totals", () => {
    expect(getCatalogResultsSummary(0)).toBe("No se encontró ningún producto.");
    expect(getCatalogResultsSummary(1)).toBe("Se encontró 1 producto.");
    expect(getCatalogResultsSummary(8)).toBe("Se encontraron 8 productos.");
  });
});
