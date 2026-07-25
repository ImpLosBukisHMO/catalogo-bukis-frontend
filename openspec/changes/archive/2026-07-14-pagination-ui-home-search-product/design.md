# Design: Add pagination UI to public catalog search

## Technical Approach

Move `/productos` from first-page client filtering to URL-driven server pagination. `SearchProductsPage` reads `page` and `query`, fetches one backend page through `getProductsPage`, renders backend `results` and `count`, and passes page/navigation metadata to a reusable `PaginationControls`. `Home` stays curated and links to `/productos`; `ProductPage` keeps its non-paginated discovery grid through the legacy `getProducts()` page-1 helper.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Page state ownership | URL owns `page` and `query` via React Router search params | Component-only state | Required for deep links, refresh safety, and canonical `/productos?page=N&query=...` behavior. |
| Data source | `SearchProductsPage` uses backend pagination only | Fetch page 1 then client-filter | Client filtering hides valid results outside page 1 and makes `count` incorrect. |
| Query cache | Use TanStack Query with a public product key factory, e.g. `productKeys.list({ page, query })` | Manual `useEffect` fetch state | Project config prefers Query for server state; key factory matches existing `workerKeys` conventions and avoids raw endpoint strings as cache keys. |
| Boundary behavior | Disable controls from `next`/`previous`; compute label from `count` and backend page-size constant | Infer availability from local array length | DRF navigation metadata is authoritative for first/last page. |
| Out-of-range handling | Show empty recovery state linking to page 1, preserving `query` | Silent redirect | Spec requires user-visible recovery and no hidden URL mutation. |
| UI primitive | Plain buttons/links with existing Tailwind tokens | Radix UI pagination primitive | No Radix component is needed; this is a simple navigational control. |

## Data Flow

```text
NavBar/sidebar search ──→ /productos?page=1&query=q
       │
       ▼
SearchProductsPage ── productKeys.list({ page, query }) ──→ getProductsPage
       │                                                   │
       ├─ ProductCard grid ← normalizePagedResponse ← /api/productos/?page=N&query=q
       └─ PaginationControls ← { page, count, next, previous }
                              └─ setSearchParams({ page: N±1, query })
```

Component hierarchy:

```text
NavBar
SearchProductsPage
├─ filter/search aside
├─ result count + empty/error states
├─ ProductCard grid
└─ PaginationControls
Footer
```

Invalid pages are detected from a page `> 1` with an empty/invalid paged result or DRF 404 invalid-page response, then rendered as a recovery empty state with `/productos?page=1&query=...`.

## File Changes

| File | Action | Description |
|---|---|---|
| `catalogo-frontend/src/services/product.ts` | Modify | Add `getProductsPage`; keep `getProducts()` as page-1 compatibility helper. |
| `catalogo-frontend/src/components/pages/responseNormalizer.ts` | Modify | Add `normalizePagedResponse<T>()` while preserving `normalizeResponse<T>()`. |
| `catalogo-frontend/src/queries/productKeys.ts` | Create | Public catalog Query key factory: `all`, `list(params)`. |
| `catalogo-frontend/src/components/elements/PaginationControls.tsx` | Create | Previous/Next buttons, `Page X of Y`, disabled/focus states using Bukis tokens. |
| `catalogo-frontend/src/components/pages/SearchProductsPage.tsx` | Modify | URL parsing, Query fetch, backend count copy, paginator, page-1 recovery action. |
| `catalogo-frontend/src/components/elements/NavBar.tsx` | Modify | Search submissions navigate to `/productos?page=1&query=...` with encoded query. |
| `catalogo-frontend/src/components/pages/Home.tsx` | Modify | Keep featured carousel; add/keep browse-all link to `/productos`, no pagination. |
| `catalogo-frontend/src/components/pages/ProductPage.tsx` | Preserve | No pagination controls; continues discovery-only `getProducts()` usage. |
| `catalogo-frontend/src/main.tsx` | Modify | Use canonical route path `/productos`. |

## Interfaces / Contracts

```ts
export type PagedResponse<T> = {
  items: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

export type GetProductsPageParams = {
  page?: number;   // defaults to 1; invalid values are clamped for requests only
  query?: string;  // sent as backend `query`; first slice URL-syncs only this filter
};

export async function getProductsPage(
  params?: GetProductsPageParams,
): Promise<PagedResponse<Product>>;
```

`getProducts()` returns `(await getProductsPage({ page: 1 })).items` to preserve Home/ProductPage consumers.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Paged normalization and legacy array fallback | Extend `responseNormalizer.test.ts`. |
| Unit | Service URL contract and `getProducts()` compatibility | Extend `services/product.test.ts`. |
| Integration | URL page/query fetch, count copy, next/previous preserving query, new search page reset, invalid-page recovery | Extend `SearchProductsPage.test.tsx` with MemoryRouter and mocked service responses. |
| E2E | None | Not available in current test stack. |

## Migration / Rollout

No data migration required. Rollout depends on `/api/productos/` continuing to expose DRF `{ count, next, previous, results }` and honoring `page` + `query`.

## Open Questions

None.
