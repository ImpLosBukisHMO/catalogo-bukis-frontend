import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import API from "../api";
import { getProducts } from "./product";

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

  it("hits the public products endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await getProducts();

    expect(mockedGet).toHaveBeenCalledWith("/api/productos/");
  });
});
