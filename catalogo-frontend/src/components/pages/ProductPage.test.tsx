import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductPage from "./ProductPage";
import { AuthContext } from "../../context/AuthContext";
import {
  getProductById,
  getProductImages,
  getProducts,
} from "../../services/product";

vi.mock("react-barcode", () => ({
  default: () => <div data-testid="barcode" />,
}));

vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/ProductCard", () => ({
  default: ({ product }: { product: { nombre: string } }) => (
    <div data-testid="product-card">{product.nombre}</div>
  ),
}));

vi.mock("../../services/carrito", () => ({
  addItem: vi.fn(),
}));

vi.mock("../../services/product", () => ({
  getProductById: vi.fn(),
  getProductImages: vi.fn(),
  getProducts: vi.fn(),
}));

const mockedGetProductById = vi.mocked(getProductById);
const mockedGetProductImages = vi.mocked(getProductImages);
const mockedGetProducts = vi.mocked(getProducts);

describe("ProductPage", () => {
  beforeEach(() => {
    mockedGetProductById.mockResolvedValue({
      id: 10,
      nombre: "Producto detalle",
      imagen: null,
      descripcion: "Descripción",
      precio: "100.00",
      peso: "1 kg",
      medidas: "10x10",
      capacidad: "1 L",
      categorias: [1],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      disponible: true,
      variantes: [
        {
          id: 500,
          item: "ITEM-500",
          codigo_barras: "1234567890",
          color: { id: 9, nombre: "Rojo", hex: "#ff0000" },
          precio: "100.00",
          stock: 4,
          activo: true,
          disponible: true,
        },
      ],
    });
    mockedGetProductImages.mockResolvedValue([]);
    mockedGetProducts.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        nombre: `Producto ${index + 1}`,
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
      })),
    );
  });

  it("keeps related products non-paginated, uses the first page product list, and caps discovery cards without rendering pagination controls", async () => {
    const router = createMemoryRouter(
      [{ path: "/producto/:id", element: <ProductPage /> }],
      { initialEntries: ["/producto/10"] },
    );

    render(
      <RouterProvider router={router} />,
    );

    expect(await screen.findByText("Producto detalle")).toBeInTheDocument();
    expect(await screen.findByText("Producto 9")).toBeInTheDocument();
    expect(screen.queryByText("Producto 10")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(9);
    expect(mockedGetProducts).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("navigation", { name: "Catalog pagination" })).not.toBeInTheDocument();
  });

  it("keeps discovery cards flat even when only a few related products remain after excluding the current product", async () => {
    mockedGetProducts.mockResolvedValue([
      {
        id: 10,
        nombre: "Producto detalle",
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
      },
      {
        id: 11,
        nombre: "Producto relacionado A",
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
      },
      {
        id: 12,
        nombre: "Producto relacionado B",
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
      },
    ]);

    const router = createMemoryRouter(
      [{ path: "/producto/:id", element: <ProductPage /> }],
      { initialEntries: ["/producto/10"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Producto relacionado A")).toBeInTheDocument();
    expect(screen.getByText("Producto relacionado B")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.queryByRole("navigation", { name: "Catalog pagination" })).not.toBeInTheDocument();
  });

  it("shows the selected variant's own price (not the product base price) when computing discount for logged-in users", async () => {
    // Regression guard: previously ProductPage displayed `product.precio` regardless of the
    // selected variant, while the cart submits the variant id and the backend charges the
    // variant's real price. If a variant has its own price and a discount applies, the UI must
    // show base = variant price and final = variant price * (1 - percentage/100).
    mockedGetProductById.mockResolvedValueOnce({
      id: 42,
      nombre: "Producto con variante cara",
      imagen: null,
      descripcion: "",
      precio: "100.00",
      peso: "1",
      medidas: "1x1",
      capacidad: "1",
      categorias: [1],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      disponible: true,
      descuento_especial: {
        id: 7,
        nombre: "Promo",
        tipo: "porcentaje",
        porcentaje: 10,
        activo: true,
        fecha_inicio: new Date("2026-01-01"),
        fecha_fin: new Date("2027-01-01"),
        es_valido: true,
      },
      variantes: [
        {
          id: 900,
          item: "ITEM-900",
          codigo_barras: "9999",
          color: { id: 1, nombre: "Verde", hex: "#00ff00" },
          precio: "150.00",
          stock: 5,
          activo: true,
          disponible: true,
        },
      ],
    });

    const router = createMemoryRouter(
      [{ path: "/producto/:id", element: <ProductPage /> }],
      { initialEntries: ["/producto/42"] },
    );

    render(
      <AuthContext.Provider
        value={{
          isLoggedIn: true,
          isStaff: false,
          isLoading: false,
          refresh: async () => {},
          setLoggedOut: () => {},
        }}
      >
        <RouterProvider router={router} />
      </AuthContext.Provider>,
    );

    // Base price must reflect the variant (150.00), NOT the product base (100.00).
    expect(await screen.findByText("$ 150.00 MXN")).toBeInTheDocument();
    expect(screen.queryByText("$ 100.00 MXN")).not.toBeInTheDocument();

    // Discounted price: 150 * 0.90 = 135.
    expect(screen.getByText(/\$ 135\.00 MXN \(-10\.00 %\)/)).toBeInTheDocument();
  });
});
