import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import API from "../api";
import { getProducts, getProductsPage } from "./product";

const mockedGet = vi.mocked(API.get);

// Minimal valid Product (only fields we assert on); the rest are not relevant
// for this contract test.
const product = (id: number, nombre: string) => ({
  id,
  nombre,
  item: `SKU-${id}`,
  imagen: null,
  descripcion: "",
  precio: "0.00",
  peso: "0.00",
  medidas: "",
  capacidad: "",
  categoria: 1,
  created_at: "",
  updated_at: "",
  disponible: true,
});

describe("getProducts", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("returns Product[] from a DRF paginated response", async () => {
    // Backend contract after catalogo-bukis-backend#39: PageNumberPagination.
    mockedGet.mockResolvedValueOnce({
      data: {
        count: 2,
        next: "http://api/productos/?page=2",
        previous: null,
        results: [product(1, "Uno"), product(2, "Dos")],
      },
    });

    const result = await getProducts();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].nombre).toBe("Dos");
  });

  it("returns Product[] from a legacy bare array response", async () => {
    // Backwards compatibility: before pagination the endpoint returned an array.
    // Keeping this case green protects against accidental regressions if the
    // backend rolls back or another endpoint reuses this service.
    mockedGet.mockResolvedValueOnce({
      data: [product(1, "Uno")],
    });

    const result = await getProducts();

    expect(result).toEqual([product(1, "Uno")]);
  });

  it("returns an empty array when the paginated response has no results", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    const result = await getProducts();

    expect(result).toEqual([]);
  });

  it("hits the public products endpoint on page 1", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await getProducts();

    expect(mockedGet).toHaveBeenCalledWith("/api/productos/?page=1");
  });
});

describe("getProductsPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("returns paginated products with backend metadata", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        count: 83,
        next: "http://api/productos/?page=3&query=libro",
        previous: "http://api/productos/?page=1&query=libro",
        results: [product(21, "Libro 1"), product(22, "Libro 2")],
      },
    });

    const result = await getProductsPage({ page: 2, query: "libro" });

    expect(result).toEqual({
      items: [product(21, "Libro 1"), product(22, "Libro 2")],
      count: 83,
      next: "http://api/productos/?page=3&query=libro",
      previous: "http://api/productos/?page=1&query=libro",
    });
  });

  it("sends page and query params to the public products endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [product(5, "Mate")],
      },
    });

    await getProductsPage({ page: 3, query: "mate cocido" });

    expect(mockedGet).toHaveBeenCalledWith("/api/productos/?page=3&query=mate+cocido");
  });

  it("keeps compatibility with legacy bare array responses", async () => {
    mockedGet.mockResolvedValueOnce({
      data: [product(1, "Uno"), product(2, "Dos")],
    });

    const result = await getProductsPage();

    expect(result).toEqual({
      items: [product(1, "Uno"), product(2, "Dos")],
      count: 2,
      next: null,
      previous: null,
    });
  });

  it("keeps getProducts on page 1 for legacy flat consumers", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        count: 2,
        next: "http://api/productos/?page=2",
        previous: null,
        results: [product(1, "Uno"), product(2, "Dos")],
      },
    });

    const result = await getProducts();

    expect(mockedGet).toHaveBeenCalledWith("/api/productos/?page=1");
    expect(result).toEqual([product(1, "Uno"), product(2, "Dos")]);
  });
});
