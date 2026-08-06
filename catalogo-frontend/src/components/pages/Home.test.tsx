import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { getNovedades, getMasVistos, getMasVendidos } from "../../services/product";
import type { Product } from "../../types/product";

vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/OfferSlider", () => ({
  default: () => <div data-testid="offer-slider" />,
}));

vi.mock("../elements/ProductCard", () => ({
  default: ({ product }: { product: { nombre: string } }) => <div>{product.nombre}</div>,
}));

vi.mock("../../services/product", () => ({
  getNovedades: vi.fn(),
  getMasVistos: vi.fn(),
  getMasVendidos: vi.fn(),
}));

vi.mock("../../services/favoritos", () => ({
  getFavoritos: vi.fn().mockResolvedValue([]),
  addFavorito: vi.fn(),
  removeFavorito: vi.fn(),
}));

const mockedGetNovedades = vi.mocked(getNovedades);
const mockedGetMasVistos = vi.mocked(getMasVistos);
const mockedGetMasVendidos = vi.mocked(getMasVendidos);

function buildProduct(id: number, nombre: string): Product {
  return {
    id,
    nombre,
    imagen: null,
    descripcion: "",
    precio: "10.00",
    peso: "1",
    medidas: "1x1",
    capacidad: "1",
    categoria: {
      id: 1,
      nombre: "Categoría 1",
      descuento: null
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    disponible: true,
  };
}

describe("Home", () => {
  beforeEach(() => {
    mockedGetNovedades.mockResolvedValue([]);
    mockedGetMasVistos.mockResolvedValue([]);
    mockedGetMasVendidos.mockResolvedValue([]);
  });

  it("keeps featured products flat and links browse-all actions to /productos without pagination controls", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /Ver todos los productos/i })).toHaveAttribute(
      "href",
      "/productos",
    );
    expect(screen.queryByRole("navigation", { name: "Catalog pagination" })).not.toBeInTheDocument();
  });

  it("renders fetched featured products without adding pagination controls", async () => {
    mockedGetNovedades.mockResolvedValue([
      buildProduct(1, "Mate Imperial"),
      buildProduct(2, "Libro Azul"),
    ]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Mate Imperial")).toBeInTheDocument();
    expect(screen.getByText("Libro Azul")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Catalog pagination" })).not.toBeInTheDocument();
  });
});
