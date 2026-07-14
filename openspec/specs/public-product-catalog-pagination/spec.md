# public-product-catalog-pagination Specification

## Purpose

Define paginated public catalog behavior for `src/components/pages/SearchProductsPage.tsx` and `src/components/elements/PaginationControls.tsx` while keeping `Home` and `ProductPage` as non-paginated discovery surfaces.

## Requirements

### Requirement: Canonical catalog pagination route

The system MUST treat `/productos?page=N&query=...` as the canonical navigable route for public catalog listing state.

#### Scenario: URL opens a specific catalog page

- GIVEN a user opens `/productos?page=3&query=mate`
- WHEN the catalog page loads
- THEN the listing SHALL request page 3 for query `mate`
- AND the visible page state SHALL match the URL

### Requirement: Server-backed paginated listing

The system MUST render catalog listings from the backend pagination contract `{ count, next, previous, results }` and SHALL show the backend `count` as the visible total results copy.

#### Scenario: Paginated results render with total count

- GIVEN the backend returns `count: 83` and a page of `results`
- WHEN the listing renders
- THEN the grid SHALL render only the returned page `results`
- AND the page SHALL show copy equivalent to `83 products found`

### Requirement: Query-preserving page navigation

The system MUST let users move between pages with classic pagination controls and SHALL preserve the current `query` value when page changes.

#### Scenario: Next page keeps the active search term

- GIVEN the current URL is `/productos?page=2&query=libro`
- WHEN the user activates the next-page control
- THEN the URL SHALL become `/productos?page=3&query=libro`
- AND the next listing request SHALL keep query `libro`

### Requirement: New search resets page state

The system MUST use page 1 when a user starts a new search term from the catalog listing.

#### Scenario: New query resets to first page

- GIVEN the current URL is `/productos?page=4&query=vinilo`
- WHEN the user submits a new query `cocina`
- THEN the URL SHALL become `/productos?page=1&query=cocina`
- AND the listing SHALL render page 1 for `cocina`

### Requirement: Pagination boundary controls

The system MUST derive pagination boundaries from backend navigation metadata. It SHALL disable or hide previous navigation when `previous` is `null` and disable or hide next navigation when `next` is `null`.

#### Scenario: First page does not allow previous navigation

- GIVEN the backend response includes `previous: null`
- WHEN the paginator renders
- THEN the previous-page control SHALL be unavailable

#### Scenario: Last page does not allow next navigation

- GIVEN the backend response includes `next: null`
- WHEN the paginator renders
- THEN the next-page control SHALL be unavailable

### Requirement: Invalid or out-of-range page recovery

The system MUST NOT silently redirect invalid or out-of-range page requests. It MUST show an empty state with an action or link that returns the user to page 1.

#### Scenario: Out-of-range page shows recovery action

- GIVEN the user opens `/productos?page=999&query=mate`
- WHEN the backend returns no valid page results for that request
- THEN the page SHALL show an empty-state recovery message
- AND the recovery action SHALL navigate to `/productos?page=1&query=mate`

### Requirement: Home and product discovery surfaces stay non-paginated

The system MUST keep Home featured content and ProductPage related products as discovery sections without pagination controls. Home SHOULD link users to `/productos` for full catalog navigation.

#### Scenario: Home links to catalog without local pagination

- GIVEN a user views Home featured products
- WHEN the section renders
- THEN it SHALL not render pagination controls
- AND any browse-all action SHALL target `/productos`

#### Scenario: Product detail recommendations remain non-paginated

- GIVEN a user views ProductPage related products
- WHEN the recommendation section renders
- THEN it SHALL not render pagination controls
