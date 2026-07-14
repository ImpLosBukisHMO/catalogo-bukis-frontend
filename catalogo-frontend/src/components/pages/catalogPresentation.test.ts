import { describe, expect, it } from "vitest";
import {
  applyLocalCatalogFilters,
  getCatalogResultsSummary,
} from "./catalogPresentation";
import type { Product } from "../../types/product";

function buildProduct(id: number, price: string, categories: number[]): Product {
  return {
    id,
    nombre: `Producto ${id}`,
    imagen: null,
    descripcion: "",
    precio: price,
    peso: "1",
    medidas: "1x1",
    capacidad: "1",
    categorias: categories,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    disponible: true,
  };
}

describe("catalogPresentation", () => {
  it("applies local category and price filters only to the current backend page items", () => {
    const products = [
      buildProduct(1, "10.00", [1]),
      buildProduct(2, "25.00", [2]),
      buildProduct(3, "40.00", [1, 3]),
    ];

    expect(
      applyLocalCatalogFilters(products, {
        categories: [1],
        minPrice: 15,
        maxPrice: 45,
      }),
    ).toEqual([products[2]]);
  });

  it("returns the approved results summary copy for zero, singular, and plural totals", () => {
    expect(getCatalogResultsSummary(0)).toBe("No se encontró ningún producto.");
    expect(getCatalogResultsSummary(1)).toBe("Se encontró 1 producto.");
    expect(getCatalogResultsSummary(8)).toBe("Se encontraron 8 productos.");
  });
});
