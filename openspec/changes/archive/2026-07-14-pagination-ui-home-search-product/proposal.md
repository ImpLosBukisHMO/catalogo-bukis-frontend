# Proposal: Add pagination UI to public catalog search

## Intent

The public catalog now receives DRF paginated responses from `/api/productos/`, but the search page still filters only the first page client-side. Users can miss valid results, cannot deep-link paginated catalog state, and cannot recover clearly from invalid page URLs. This slice adds correct server-backed pagination to `/productos` without changing Home or ProductPage discovery sections.

## Scope

### In Scope
- Add canonical `/productos?page=N&query=...` pagination behavior for the search/listing page.
- Introduce reusable pagination controls with Previous/Next and `Page X of Y`.
- Preserve backend total `count` in visible results copy and show empty-state recovery for invalid/out-of-range pages.
- Keep `getProducts()` for legacy flat consumers while adding a paginated service API.

### Out of Scope
- Pagination controls on Home featured products.
- Pagination controls on ProductPage “more products”.
- Renaming `query` to `search`.
- Full URL sync for advanced filters or a broader filter redesign.

## Capabilities

### New Capabilities
- `public-product-catalog-pagination`: Public catalog search MUST support server-backed pagination, URL-synced page state, and invalid-page recovery.

### Modified Capabilities
- None.

## Approach

Add `getProductsPage({ page, query })` returning `{ items, count, next, previous }`, while `getProducts()` remains a page-1 compatibility helper. Update `SearchProductsPage` to read `page` and `query` from the URL, call backend pagination/search instead of client-only search filtering, reset to page 1 on new search, preserve query params across pagination, and render paginator below the grid. Keep Home and ProductPage on flat page-1 consumption with links toward `/productos` rather than new pagination UI.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `catalogo-frontend/src/services/product.ts` | Modified | Add paginated catalog fetch and preserve legacy helper |
| `catalogo-frontend/src/components/pages/responseNormalizer.ts` | Modified | Support paginated metadata extraction without breaking flat normalization |
| `catalogo-frontend/src/components/pages/SearchProductsPage.tsx` | Modified | Move search pagination to URL + backend-backed flow |
| `catalogo-frontend/src/components/elements/PaginationControls.tsx` | New | Reusable public catalog pagination UI |
| `catalogo-frontend/src/services/product.test.ts` | Modified | Cover paginated contract |
| `catalogo-frontend/src/components/pages/SearchProductsPage.test.tsx` | Modified | Cover URL sync, count, and invalid-page empty state |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backend query params differ from assumptions | Medium | Limit MVP contract to confirmed `page` + `query`; spec backend dependency clearly |
| Local category/price filters become inconsistent with paged data | Medium | Treat advanced filters as deferred or preserve only if cheap and non-expanding |
| Scroll container hides paginator | Low | Remove internal grid overflow when wiring final layout |

## Rollback Plan

Revert `SearchProductsPage` to the current flat `getProducts()` flow and remove `PaginationControls`. Legacy consumers remain functional because `getProducts()` is preserved; no migration or backend rollback is required.

## Dependencies

- `catalogo-bukis-backend` `/api/productos/` DRF pagination contract: `{ count, next, previous, results }`
- Existing React Router query-param handling on `/productos`

## Success Criteria

- [ ] `/productos?page=N&query=...` renders the requested catalog page with server-backed data.
- [ ] Results count reflects backend `count`, not only current page size.
- [ ] Invalid/out-of-range pages show an empty state with a clear action to return to page 1.
- [ ] Home and ProductPage remain non-paginated discovery surfaces in this MVP.
