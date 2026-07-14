export const PUBLIC_PRODUCTS_PATH = "/productos";
export const PUBLIC_PRODUCTS_PAGE_SIZE = 20;

export function normalizeCatalogQuery(value?: string | null): string {
  return value?.trim() ?? "";
}

export function buildCatalogLocation(params?: { page?: number; query?: string | null }): string {
  const searchParams = new URLSearchParams();
  const page = params?.page && Number.isInteger(params.page) && params.page > 0 ? params.page : 1;

  searchParams.set("page", String(page));

  const query = normalizeCatalogQuery(params?.query);
  if (query) {
    searchParams.set("query", query);
  }

  return `${PUBLIC_PRODUCTS_PATH}?${searchParams.toString()}`;
}

export function parseCatalogPageParam(value?: string | null): {
  page: number;
  isExplicit: boolean;
  isInvalid: boolean;
} {
  if (!value) {
    return { page: 1, isExplicit: false, isInvalid: false };
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return { page: 1, isExplicit: true, isInvalid: true };
  }

  return { page, isExplicit: true, isInvalid: false };
}
