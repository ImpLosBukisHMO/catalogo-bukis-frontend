import type { Product } from "../../types/product";

export const CATALOG_PAGINATION_ARIA_LABEL = "Catalog pagination";

type LocalCatalogFilters = {
  categories: number[];
  minPrice: number | null;
  maxPrice: number | null;
};

export function applyLocalCatalogFilters(
  products: Product[],
  filters: LocalCatalogFilters,
): Product[] {
  return products.filter((product) => {
    const productCategories = product.categorias || [];
    const matchesCategory =
      filters.categories.length === 0 ||
      productCategories.some((category) => filters.categories.includes(category));
    const price = Number(product.precio);
    const matchesPrice =
      (filters.minPrice === null || price >= filters.minPrice) &&
      (filters.maxPrice === null || price <= filters.maxPrice);

    return matchesCategory && matchesPrice;
  });
}

export function getCatalogResultsSummary(count: number): string {
  if (count === 0) {
    return "No se encontró ningún producto.";
  }

  if (count === 1) {
    return "Se encontró 1 producto.";
  }

  return `Se encontraron ${count} productos.`;
}
