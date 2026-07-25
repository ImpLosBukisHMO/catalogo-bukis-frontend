import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchProductsPage from "./SearchProductsPage";
import { getCategories } from "../../services/category";
import { getProductsPage, getProductById } from "../../services/product";
import { getFavoritos } from "../../services/favoritos";
import type { PagedResponse } from "./responseNormalizer";
import type { Product } from "../../types/product";


const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/NavBar", () => ({
  default: ({ navBarQuery }: { navBarQuery?: string }) => <div data-testid="navbar">{navBarQuery ?? ""}</div>,
}));

vi.mock("../elements/ProductCard", () => ({
  default: ({ product, onToggleFavorite }: { product: { id: number; nombre: string }; onToggleFavorite: (p: { id: number; nombre: string }) => void }) => (
    <div>
      {product.nombre}
      <button type="button" data-testid="fav-btn" onClick={() => onToggleFavorite(product)}>Fav</button>
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
  getProductsPage: vi.fn(),
  getProductById: vi.fn(),
}));

const mockedGetProductsPage = vi.mocked(getProductsPage);
const mockedGetCategories = vi.mocked(getCategories);
const mockedGetFavoritos = vi.mocked(getFavoritos);

const mockedGetProductById = vi.mocked(getProductById);
mockedGetProductById.mockResolvedValue({
  id: 1,
  nombre: 'Audífonos Bluetooth',
  imagen: null,
  descripcion: '',
  precio: '10.00',
  peso: '1',
  medidas: '1x1',
  capacidad: '1',
  categoria: { id: 1, nombre: 'Electrónicos', descuento: null },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  disponible: true,
  variantes: [
    {
      id: 1,
      item: 'test-item',
      stock: 10,
      activo: true,
      disponible: true,
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

function buildPagedResponse(
  items: Product[],
  count: number,
  navigation?: Partial<Pick<PagedResponse<Product>, "next" | "previous">>,
): PagedResponse<Product> {
  return {
    items,
    count,
    next: navigation?.next ?? null,
    previous: navigation?.previous ?? null,
  };
}

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderSearchProductsPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/productos"
            element={
              <>
                <SearchProductsPage />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchProductsPage", () => {
  beforeEach(() => {
    mockedGetCategories.mockResolvedValue([]);
    mockedGetProductsPage.mockReset();
    mockedGetFavoritos.mockReset();
    mockedGetFavoritos.mockResolvedValue([]);
    localStorage.clear();
    consoleErrorSpy.mockClear();
  });

  it("requests page and query from the URL and renders the backend total count", async () => {
    mockedGetProductsPage.mockResolvedValue(
      buildPagedResponse([buildProduct(1, "Mate Imperial")], 83, {
        previous: "/api/productos/?page=2&query=mate",
        next: "/api/productos/?page=4&query=mate",
      }),
    );

    renderSearchProductsPage("/productos?page=3&query=mate");

    expect(await screen.findByText("Mate Imperial")).toBeInTheDocument();
    expect(mockedGetProductsPage).toHaveBeenCalledWith({ page: 3, query: "mate" });
    expect(screen.getByText("Se encontraron 83 productos.")).toBeInTheDocument();
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });

  it("preserves the active query when moving to the next page", async () => {
    mockedGetProductsPage.mockImplementation(async ({ page, query } = {}) => {
      if (page === 2 && query === "libro") {
        return buildPagedResponse([buildProduct(2, "Libro Azul")], 45, {
          previous: "/api/productos/?page=1&query=libro",
          next: "/api/productos/?page=3&query=libro",
        });
      }

      if (page === 3 && query === "libro") {
        return buildPagedResponse([buildProduct(3, "Libro Rojo")], 45, {
          previous: "/api/productos/?page=2&query=libro",
          next: null,
        });
      }

      throw new Error(`Unexpected page request: ${page} / ${query}`);
    });

    renderSearchProductsPage("/productos?page=2&query=libro");

    expect(await screen.findByText("Libro Azul")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Next page" }));

    expect(await screen.findByText("Libro Rojo")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/productos?page=3&query=libro");
    expect(mockedGetProductsPage).toHaveBeenLastCalledWith({ page: 3, query: "libro" });
  });

  it("resets to page 1 when a new search is submitted from the sidebar", async () => {
    mockedGetProductsPage.mockImplementation(async ({ page, query } = {}) => {
      if (page === 4 && query === "vinilo") {
        return buildPagedResponse([buildProduct(4, "Vinilo Clásico")], 28, {
          previous: "/api/productos/?page=3&query=vinilo",
          next: null,
        });
      }

      if (page === 1 && query === "cocina") {
        return buildPagedResponse([buildProduct(5, "Set de Cocina")], 6, {
          previous: null,
          next: null,
        });
      }

      throw new Error(`Unexpected page request: ${page} / ${query}`);
    });

    renderSearchProductsPage("/productos?page=4&query=vinilo");

    expect(await screen.findByText("Vinilo Clásico")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Busque un producto"), {
      target: { value: "  cocina  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar filtro\(s\)/i }));

    expect(await screen.findByText("Set de Cocina")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/productos?page=1&query=cocina");
    expect(mockedGetProductsPage).toHaveBeenLastCalledWith({ page: 1, query: "cocina" });
  });

  it("shows a recovery action for invalid or out-of-range pages", async () => {
    mockedGetProductsPage.mockResolvedValue(
      buildPagedResponse([], 83, {
        previous: null,
        next: null,
      }),
    );

    renderSearchProductsPage("/productos?page=999&query=mate");

    expect(await screen.findByText("No encontramos resultados para esta página.")).toBeInTheDocument();

    const recoveryLink = screen.getByRole("link", { name: "Ir a la página 1" });
    expect(recoveryLink).toHaveAttribute("href", "/productos?page=1&query=mate");
    expect(mockedGetProductsPage).toHaveBeenCalledWith({ page: 999, query: "mate" });
  });

  it("shows the recovery UI when the requested page returns a 404", async () => {
    mockedGetProductsPage.mockRejectedValue({
      response: { status: 404 },
    });

    renderSearchProductsPage("/productos?page=999&query=mate");

    expect(await screen.findByText("No encontramos resultados para esta página.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a la página 1" })).toHaveAttribute(
      "href",
      "/productos?page=1&query=mate",
    );
  });

  it("does not fetch favoritos for anonymous visitors without an access token", async () => {
    // Regression guard: previously SearchProductsPage always called getFavoritos() on mount,
    // hitting a protected endpoint that returned 401 for anonymous visitors and showing a
    // spurious "Error al obtener productos favoritos" toast on the public catalog.
    mockedGetProductsPage.mockResolvedValue(
      buildPagedResponse([buildProduct(1, "Mate Imperial")], 1, {
        previous: null,
        next: null,
      }),
    );

    renderSearchProductsPage("/productos?page=1");

    expect(await screen.findByText("Mate Imperial")).toBeInTheDocument();
    expect(mockedGetFavoritos).not.toHaveBeenCalled();
    expect(screen.queryByText(/Error al obtener productos favoritos/)).not.toBeInTheDocument();
  });

  it("fetches favoritos when the visitor has an access token", async () => {
    localStorage.setItem("access", "fake-jwt");
    mockedGetProductsPage.mockResolvedValue(
      buildPagedResponse([buildProduct(1, "Mate Imperial")], 1, {
        previous: null,
        next: null,
      }),
    );

    renderSearchProductsPage("/productos?page=1");

    expect(await screen.findByText("Mate Imperial")).toBeInTheDocument();
    expect(mockedGetFavoritos).toHaveBeenCalledTimes(1);
  });

  it("shows a non-blocking warning when categories fail to load", async () => {
    mockedGetCategories.mockRejectedValue(new Error("categories unavailable"));
    mockedGetProductsPage.mockResolvedValue(
      buildPagedResponse([buildProduct(1, "Mate Imperial")], 1, {
        previous: null,
        next: null,
      }),
    );

    renderSearchProductsPage("/productos?page=1&query=mate");

    expect(await screen.findByText("Mate Imperial")).toBeInTheDocument();
    expect(
      screen.getByText("No pudimos cargar las categorías. Los filtros por categoría podrían no estar disponibles."),
    ).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});