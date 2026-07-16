import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductPage from "./ProductPage";
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
});
