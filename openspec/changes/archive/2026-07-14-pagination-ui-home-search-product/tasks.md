# Tasks: Pagination UI for Public Catalog Search

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450-650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation + service/tests → PR 2 catalog UI + pagination → PR 3 discovery surfaces + verification |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Paged contract foundation | PR 1 | service, normalizer, query keys, RED/GREEN tests |
| 2 | `/productos` server pagination UX | PR 2 | SearchProductsPage + PaginationControls + NavBar route sync |
| 3 | Keep discovery surfaces flat | PR 3 | Home/ProductPage updates, no pagination controls, final verification |

## Phase 1: Foundation

- [x] 1.1 RED: Extend `catalogo-frontend/src/components/pages/responseNormalizer.test.ts` for `normalizePagedResponse()` and legacy flat fallback.
- [x] 1.2 GREEN: Update `catalogo-frontend/src/components/pages/responseNormalizer.ts` with `PagedResponse<T>` parsing that preserves `count`, `next`, `previous`, and `items`.
- [x] 1.3 RED: Extend `catalogo-frontend/src/services/product.test.ts` for `getProductsPage({ page, query })`, request params, and `getProducts()` page-1 compatibility.
- [x] 1.4 GREEN: Update `catalogo-frontend/src/services/product.ts` and add `catalogo-frontend/src/queries/productKeys.ts` for stable paged catalog keys.

## Phase 2: Catalog Pagination UI

- [x] 2.1 RED: Expand `catalogo-frontend/src/components/pages/SearchProductsPage.test.tsx` for URL-owned `page/query`, backend `count`, next/previous boundaries, and new-search reset to page 1.
- [x] 2.2 RED: Add `catalogo-frontend/src/components/elements/PaginationControls.test.tsx` for `Page X of Y`, disabled edge buttons, and query-preserving navigation.
- [x] 2.3 GREEN: Create `catalogo-frontend/src/components/elements/PaginationControls.tsx` with reusable previous/next controls and accessible disabled states.
- [x] 2.4 GREEN: Refactor `catalogo-frontend/src/components/pages/SearchProductsPage.tsx` to use search params, TanStack Query, paged results mapping, invalid-page recovery, and paginator rendering.
- [x] 2.5 GREEN: Update `catalogo-frontend/src/components/elements/NavBar.tsx` and `catalogo-frontend/src/main.tsx` so searches navigate to canonical `/productos?page=1&query=...`.

## Phase 3: Discovery Surfaces Stay Flat

- [x] 3.1 RED: Add/extend page tests proving Home browse-all links to `/productos` and renders no pagination controls.
- [x] 3.2 GREEN: Update `catalogo-frontend/src/components/pages/Home.tsx` to keep featured products flat and expose a browse-all link to `/productos`.
- [x] 3.3 RED: Add/extend ProductPage tests proving related products stay non-paginated and exclude pagination controls.
- [x] 3.4 GREEN: Update `catalogo-frontend/src/components/pages/ProductPage.tsx` to keep `getProducts()` discovery usage, likely cap related items at `pageSize=9`, and render no paginator.

## Phase 4: Refactor and Verification

- [x] 4.1 REFACTOR: Remove obsolete client-only filtering paths in `SearchProductsPage.tsx`; keep local category/price behavior explicitly scoped or deferred per spec.
- [x] 4.2 REFACTOR: Align shared copy/states across `SearchProductsPage.tsx`, `PaginationControls.tsx`, and related tests without changing route contracts.
- [x] 4.3 VERIFY: Run `npm test`, `npm run lint`, and `npm run build` in `catalogo-bukis-frontend/catalogo-frontend` and record failures before apply closes.
