# Tasks: limpieza-auth-legacy-frontend

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation

- [x] 1.1 Logout contract in `src/services/auth.ts`, `src/api/index.ts` — add `logout(onClearAuth, navigate?)`, clear only `access|refresh|me`, and let the interceptor use a noop callback. Verify `npx tsc -b --noEmit`.
- [x] 1.2 User service cleanup in `src/services/user.ts` — `signUp` accepts 200|201 and JWT-only login, while `getLoggedUserData` and `updateUserData` stop building manual `Authorization` headers. Verify `npm run test` plus profile-save smoke.

## Phase 2: UI migrations

- [x] 2.1 Login page hotfix in `src/components/pages/LogInPage.tsx` — remove `logIn` import/call and keep JWT `login/getMe/isWorker`. Verify worker login smoke.
- [x] 2.2 Signup success flow in `src/components/pages/SignUpPage.tsx` — preserve successful post-signup authenticated flow after `signUp`. Verify new-user signup smoke.
- [x] 2.3 NavBar migration in `src/components/elements/NavBar.tsx`, `src/components/elements/NavBar.test.tsx` — move from `services/user.logOut` to `services/auth.logout`, pass consistent auth clearing, and update mocks. Verify `npm run test`.
- [x] 2.4 Worker sidebar migration in `src/components/elements/WorkerSidebar.tsx` — replace legacy logout with the shared JWT-only logout path. Verify worker logout smoke.

## Phase 3: Legacy-token removal

- [x] 3.1 Guard simplification in `src/context/AuthProvider.tsx`, `src/api/index.ts` — collapse `access ?? token` to `access` and remove `removeItem("token")`. Verify `npx tsc -b --noEmit`.
- [x] 3.2 Inline page guard cleanup in `src/components/pages/{Home,ProductPage,PedidoDetallePage,MisPedidosPage,FavoritosPage,SearchProductsPage}.tsx` — replace each legacy fallback check with `access` only. Verify catalog, favorites, cart, and orders smoke.
- [x] 3.3 Hard delete legacy auth in `src/services/user.ts` and remaining callers — remove `logIn`, `logOut`, and any `localStorage("token")` dependency. Verify `rg 'localStorage\.(get|set|remove)Item\("token"' src/` returns 0.

## Phase 4: Verification

- [x] 4.1 Automated verification in the frontend repo — run `npm run test`, `npx tsc -b --noEmit`, `npm run lint`, and `npm run build`.
- [x] 4.2 Manual smoke matrix — worker login, new-user signup, profile save + reload, NavBar logout, WorkerSidebar logout, and existing `access+refresh` session survives refresh.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 160-220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Recommendation on delivery strategy: Stay single PR. A hotfix-first slice is possible if production pressure appears, but the current forecast stays under budget.

## Post-review remediation

- [x] Bounded remediation approved and applied: cleanup/logout paths now purge stale legacy `localStorage["token"]`, interceptor refresh branches have deterministic regression coverage, and one additional page-level guard regression test confirms token-only browser state is still treated as logged out.
- [x] Final ProductPage remediation applied: favoritos fetch/toggle logic now requires JWT `access` instead of trusting `AuthContext.isLoggedIn`, with regression coverage for auth/storage desync states.
