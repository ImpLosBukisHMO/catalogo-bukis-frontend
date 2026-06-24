import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchProductsPage from "./SearchProductsPage";
import { getCategories } from "../../services/category";
import { getProducts } from "../../services/product";
import type { Product } from "../../types/product";

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/ProductCard", () => ({
  default: ({ product }: { product: { nombre: string } }) => <div>{product.nombre}</div>,
}));

vi.mock("../../services/favoritos", () => ({
  addFavorito: vi.fn(),
}));

vi.mock("../../services/category", () => ({
  getCategories: vi.fn(),
}));

vi.mock("../../services/product", () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
}));

const mockedGetProducts = vi.mocked(getProducts);
const mockedGetCategories = vi.mocked(getCategories);

function buildProduct(id: number, nombre: string): Product {
  return {
    id,
    nombre,
    item: `SKU-${id}`,
    imagen: null,
    descripcion: "",
    precio: "10.00",
    peso: "1",
    medidas: "1x1",
    capacidad: "1",
    categorias: [1],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    disponible: true,
  };
}

describe("SearchProductsPage", () => {
  beforeEach(() => {
    mockedGetCategories.mockResolvedValue([]);
    mockedGetProducts.mockResolvedValue([
      buildProduct(1, "Audífonos Bluetooth"),
      buildProduct(2, "Té Verde"),
    ]);
  });

  it("filters query results with accent-insensitive matching", async () => {
    render(
      <MemoryRouter initialEntries={["/productos?query=audifonos"]}>
        <Routes>
          <Route path="/productos" element={<SearchProductsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Audífonos Bluetooth")).toBeInTheDocument();
    expect(screen.queryByText("Té Verde")).not.toBeInTheDocument();
    expect(screen.getByText("Se encontró 1 producto.")).toBeInTheDocument();
  });
});
