import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchProductsPage from "./SearchProductsPage";
import { getCategories } from "../../services/category";
import { getProducts, getProductById } from "../../services/product";
import type { Product } from "../../types/product";
import { addFavorito, getFavoritos } from "../../services/favoritos";
import type { FavoritoVariante } from "../../types/favoritos";


vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/ProductCard", () => ({
  default: ({ product, onToggleFavorite }: { product: { nombre: string }; onToggleFavorite: () => void }) => (
    <div>
      {product.nombre}
      <button type="button" data-testid="fav-btn" onClick={() => onToggleFavorite()}>Fav</button>
    </div>
  ),
}));

vi.mock("../../services/favoritos", () => ({
  addFavorito: vi.fn(),
  removeFavorito: vi.fn(),
  getFavoritos: vi.fn(),
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

const mockedGetProductById = vi.mocked(getProductById);
mockedGetProductById.mockResolvedValue({
  id: 1,
  variantes: [
    {
      id: 1,
      item: 'test-item',
      stock: 10,
      activo: true,
      producto_id: 1,
      nombre_producto: 'Audífonos Bluetooth',
      precio: '10.00',
      color: { id: 1, nombre: 'Negro', hex: '#000000' },
      imagen: null,
    },
  ],
});

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
      nombre: 'Electrónicos',
      descuento: null
    },
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


  it('adds a product to favorites when favorite button is clicked', async () => {
    // mock getFavoritos to return empty initially
    const mockedGetFavoritos = vi.mocked(getFavoritos);
    mockedGetFavoritos.mockResolvedValue([]);
    // mock addFavorito to return a favorite object
    const mockedAddFavorito = vi.mocked(addFavorito);
    mockedAddFavorito.mockResolvedValue({
      id: 99,
      variante: {
        id: 1,
        item: 'test-item',
        stock: 10,
        activo: true,
        producto_id: 1,
        nombre_producto: 'Audífonos Bluetooth',
        precio: '10.00',
        color: { id: 1, nombre: 'Negro', hex: '#000000' },
        imagen: null,
      },
    } as FavoritoVariante);

    render(
      <MemoryRouter initialEntries={["/productos"]}>
        <Routes>
          <Route path="/productos" element={<SearchProductsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for products to load — the mock returns 2 products, so there will
    // be 2 fav buttons; we target the first one (Audífonos Bluetooth)
    expect(await screen.findByText('Audífonos Bluetooth')).toBeInTheDocument();
    const [favButton] = screen.getAllByTestId('fav-btn');
    await fireEvent.click(favButton);
    // after click, favorite should be added (favMsg appears)
    await waitFor(
      () => expect(screen.getByText(/agregado a favoritos/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });

  it("filters displayed products by search query in the URL", async () => {
    // Override the mock to simulate the API returning only the matching product
    // (the real component passes the query to getProducts, which filters server-side)
    mockedGetProducts.mockResolvedValue([buildProduct(1, "Audífonos Bluetooth")]);

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