import type { Product } from "../../types/product";
import { stripDiacritics } from "../../utils/normalizers";

export const CATALOG_PAGINATION_ARIA_LABEL = "Catalog pagination";

type LocalCatalogFilters = {
  categories: number[];
  minPrice: number | null;
  maxPrice: number | null;
  query?: string;
};

export function applyLocalCatalogFilters(
  products: Product[],
  filters: LocalCatalogFilters,
): Product[] {
  return products.filter((product) => {
    const categoryId = product.categoria?.id;
    const matchesCategory =
      filters.categories.length === 0 ||
      (categoryId != null && filters.categories.includes(categoryId));
    const price = Number(product.precio);
    const matchesPrice =
      (filters.minPrice === null || price >= filters.minPrice) &&
      (filters.maxPrice === null || price <= filters.maxPrice);

    let matchesName = true;
    if (filters.query) {
      matchesName = stripDiacritics(product.nombre).toLowerCase().includes(
        stripDiacritics(filters.query).toLowerCase()
      );
    }

    return matchesCategory && matchesPrice && matchesName;
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
