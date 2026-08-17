import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import ProductCard from "./ProductCard";
import { BACKEND_BASE_URL } from "../../utils/backend";

describe("ProductCard", () => {
  it("resolves relative backend media URLs before rendering the product image", () => {
    const router = createMemoryRouter(
      [{ path: "/", element: (
        <ProductCard
          product={{
            id: 1,
            nombre: "Producto con media",
            precio: 10,
            imagenUrl: "/media/img/products/galeria/card.jpg",
            disponible: true,
            categoria: { id: 1, nombre: "Cat", descuento: null },
            descuento_especial: null,
          }}
          isLikedByUser={false}
        />
      ) }],
      { initialEntries: ["/"] },
    );

    render(
      <RouterProvider router={router} />,
    );

    expect(screen.getByAltText("Producto con media")).toHaveAttribute(
      "src",
      `${BACKEND_BASE_URL}/media/img/products/galeria/card.jpg`,
    );
  });
});
