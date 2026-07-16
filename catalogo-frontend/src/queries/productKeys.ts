export type ProductListParams = {
  page?: number;
  query?: string;
};

export const productKeys = {
  all: ["products"] as const,

  list: (params?: ProductListParams) => [
    ...productKeys.all,
    "list",
    {
      page: params?.page ?? 1,
      query: params?.query ?? "",
    },
  ] as const,
} as const;
