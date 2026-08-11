# Apply Progress: limpieza-auth-legacy-frontend

**Change**: limpieza-auth-legacy-frontend  
**Mode**: Strict TDD  
**Delivery**: size:exception approved after prior apply reported 680 changed lines against the 400-line budget

## Completed Tasks

- [x] 1.1 Logout contract in `src/services/auth.ts`, `src/api/index.ts`
- [x] 1.2 User service cleanup in `src/services/user.ts`
- [x] 2.1 Login page hotfix in `src/components/pages/LogInPage.tsx`
- [x] 2.2 Signup success flow in `src/components/pages/SignUpPage.tsx`
- [x] 2.3 NavBar migration in `src/components/elements/NavBar.tsx`, `src/components/elements/NavBar.test.tsx`
- [x] 2.4 Worker sidebar migration in `src/components/elements/WorkerSidebar.tsx`
- [x] 3.1 Guard simplification in `src/context/AuthProvider.tsx`, `src/api/index.ts`
- [x] 3.2 Inline page guard cleanup in `src/components/pages/{Home,ProductPage,PedidoDetallePage,MisPedidosPage,FavoritosPage,SearchProductsPage}.tsx`
- [x] 3.3 Hard delete legacy auth in `src/services/user.ts` and remaining callers
- [x] 4.1 Automated verification in the frontend repo
- [x] 4.2 Manual smoke matrix / final apply evidence

## Review Remediation

- [x] Approved bounded remediation: cleanup/logout paths now remove stale legacy `localStorage["token"]` in `src/services/auth.ts`, `src/context/AuthProvider.tsx`, and the `token_not_valid` interceptor branch in `src/api/index.ts`.
- [x] Added deterministic interceptor regression coverage for refresh retry success and refresh-failure logout cleanup.
- [x] Added one extra page-level guard regression in `src/components/pages/Home.test.tsx` so token-only browser state still skips authenticated favoritos loading.
- [x] Final ProductPage remediation now gates favoritos fetch/toggle behavior on JWT `access` via `getAccessToken()` and covers both desynced states: `isLoggedIn=true` without access skips the protected fetch, while access-present storage can still load favoritos.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `src/services/auth.test.ts`, `src/api/index.test.ts` | Unit | ✅ `npx vitest run src/components/elements/NavBar.test.tsx src/components/pages/Home.test.tsx src/components/pages/SearchProductsPage.test.tsx src/components/pages/ProductPage.test.tsx` → 15/15 | ✅ New logout/interceptor assertions failed first | ✅ `npx vitest run src/services/auth.test.ts src/api/index.test.ts` → 4/4 | ✅ access-only + token_not_valid cases | ✅ simplified client-only logout |
| 1.2 | `src/services/user.test.ts` | Unit | ✅ same 15/15 baseline | ✅ signup 201/manual-header tests failed first | ✅ `npx vitest run src/services/user.test.ts` → 4/4 | ✅ 200 + 201 signup cases | ✅ removed legacy helpers and duplicate auth headers |
| 2.1 | `src/components/pages/LogInPage.test.tsx` | Integration | ✅ same 15/15 baseline | ✅ legacy login regression assertions failed first | ✅ `npx vitest run src/components/pages/LogInPage.test.tsx` → 2/2 | ✅ worker + customer redirects | ✅ removed legacy import/call only |
| 2.2 | `src/components/pages/SignUpPage.test.tsx` | Integration | ✅ same 15/15 baseline | ✅ post-signup navigation assertion failed first | ✅ `npx vitest run src/components/pages/SignUpPage.test.tsx` → 1/1 | ➖ Single success-path scenario in spec | ✅ minimal navigate addition |
| 2.3 | `src/components/elements/NavBar.test.tsx` | Integration | ✅ same 15/15 baseline | ✅ shared logout callback assertion failed first | ✅ `npx vitest run src/components/elements/NavBar.test.tsx` → 3/3 | ✅ kept search tests + logout path | ✅ migrated import and preserved API |
| 2.4 | `src/components/elements/WorkerSidebar.test.tsx` | Integration | ✅ same 15/15 baseline | ✅ shared logout callback assertion failed first | ✅ `npx vitest run src/components/elements/WorkerSidebar.test.tsx` → 1/1 | ➖ Single logout behavior | ✅ migrated to shared auth/logout contract |
| 3.1 | `src/context/AuthProvider.test.tsx`, `src/api/index.test.ts` | Unit/Integration | ✅ same 15/15 baseline | ✅ access-only cache assertions failed first | ✅ `npx vitest run src/context/AuthProvider.test.tsx src/api/index.test.ts` → 4/4 | ✅ cached-auth + interceptor cases | ✅ removed remaining token cleanup branches |
| 3.2 | `src/components/pages/SearchProductsPage.test.tsx` | Integration | ✅ same 15/15 baseline | ✅ legacy-token favoritos test failed first | ✅ `npx vitest run src/components/pages/SearchProductsPage.test.tsx` → 9/9 | ✅ anonymous/access/token-only cases | ✅ collapsed page guards to access-only checks |
| 3.3 | `src/services/user.test.ts`, `src/components/pages/LogInPage.test.tsx` | Unit/Integration | ✅ same 15/15 baseline | ✅ legacy service usage assertions failed first | ✅ `npx vitest run src/services/user.test.ts src/components/pages/LogInPage.test.tsx` → 6/6 | ✅ service + caller coverage | ✅ deleted `logIn`/`logOut` implementation |
| 4.1 | full suite | Runtime | ✅ focused files already green | ✅ full verification blocked until code/test updates completed | ✅ `npm run test` → 81/81, `npx tsc -b --noEmit` → success, `npm run build` → success | ✅ lint/build/test together | ✅ fixed test typing + hook deps during verification |
| 4.2 | existing auth smoke tests + runtime verification | Runtime evidence | ✅ 4.1 suite already green before smoke pass | N/A — evidence-only task, no production change | ✅ `npx vitest run src/components/pages/LogInPage.test.tsx src/components/pages/SignUpPage.test.tsx src/components/elements/NavBar.test.tsx src/components/elements/WorkerSidebar.test.tsx src/services/user.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx` → 15/15; `npm run test` → 81/81; `npx tsc -b --noEmit` → success; `npm run lint` → 0 errors/1 pre-existing warning; `npm run build` → success | ✅ covered worker/regular login, signup 201, logout, profile auth, guard cleanup; refresh positive path remains code-inspection-only | ✅ no app code changed; rollback is revert task/apply artifacts only |
| Review remediation | `src/services/auth.test.ts`, `src/api/index.test.ts`, `src/context/AuthProvider.test.tsx`, `src/components/pages/Home.test.tsx` | Unit/Integration | ✅ `npx vitest run src/services/auth.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx src/components/pages/Home.test.tsx` → 8/8 before remediation | ✅ updated cleanup/interceptor/guard assertions failed first | ✅ `npx vitest run src/services/auth.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx src/components/pages/Home.test.tsx` → 11/11 | ✅ token_not_valid cleanup + refresh retry + refresh-failure logout + token-only page guard | ✅ production diff stayed scoped to three cleanup paths; extra regression only in tests |
| Final ProductPage remediation | `src/components/pages/ProductPage.test.tsx`, `src/context/AuthProvider.test.tsx` | Integration | ✅ `npx vitest run src/components/pages/ProductPage.test.tsx src/context/AuthProvider.test.tsx` → 5/5 with a reproducible 401 stderr from ProductPage favoritos fetch | ✅ new ProductPage auth/storage desync assertions failed first | ✅ `npx vitest run src/components/pages/ProductPage.test.tsx src/context/AuthProvider.test.tsx` → 7/7 | ✅ no-access + access-present desync cases | ✅ reused `getAccessToken()` to remove inline storage reads from ProductPage favoritos logic |

## Work Unit Evidence

| Work Unit | Focused test command and exact result | Runtime harness command/scenario and exact result | Rollback boundary |
|-----------|---------------------------------------|---------------------------------------------------|-------------------|
| JWT-only service/auth cleanup | `npx vitest run src/services/auth.test.ts src/api/index.test.ts src/services/user.test.ts src/context/AuthProvider.test.tsx` → 12 tests passed | `npx tsc -b --noEmit` → success | Revert `src/services/auth.ts`, `src/api/index.ts`, `src/services/user.ts`, `src/context/AuthProvider.tsx`, related tests |
| Login/signup/logout UI migration | `npx vitest run src/components/pages/LogInPage.test.tsx src/components/pages/SignUpPage.test.tsx src/components/elements/NavBar.test.tsx src/components/elements/WorkerSidebar.test.tsx` → 7 tests passed | `npm run test` → 81/81 passing; SPA auth flows compile and bundle | Revert login/signup pages, NavBar, WorkerSidebar, and their tests |
| Legacy-token guard removal | `npx vitest run src/components/pages/SearchProductsPage.test.tsx` → 9 tests passed | `npm run build` → success; JWT-only bundle emitted under `dist/` | Revert page guard edits in `Home.tsx`, `ProductPage.tsx`, `PedidoDetallePage.tsx`, `MisPedidosPage.tsx`, `FavoritosPage.tsx`, `SearchProductsPage.tsx` |
| Auth cleanup smoke evidence | `npx vitest run src/components/pages/LogInPage.test.tsx src/components/pages/SignUpPage.test.tsx src/components/elements/NavBar.test.tsx src/components/elements/WorkerSidebar.test.tsx src/services/user.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx` → 15 tests passed | `npm run test` → 81/81; `npx tsc -b --noEmit` → success; `npm run lint` → 0 errors/1 pre-existing warning in `src/components/pages/CarritoPage.tsx:107`; `npm run build` → success with pre-existing Vite chunk-size warning | Revert only `openspec/changes/limpieza-auth-legacy-frontend/{tasks.md,apply-progress.md}` if evidence needs to be withdrawn; production/frontend auth code is unchanged in this batch |
| Review remediation after bounded review | `npx vitest run src/services/auth.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx src/components/pages/Home.test.tsx` → 11 tests passed | `npm run test` / `npx tsc -b --noEmit` / `npm run lint` / `npm run build` rerun after scoped cleanup fix; production grep confirmed no `getItem("token")` or `setItem("token")` outside tests | Revert `src/services/auth.ts`, `src/api/index.ts`, `src/context/AuthProvider.tsx`, the four focused tests, and the OpenSpec artifact notes |
| Final ProductPage remediation | `npx vitest run src/components/pages/ProductPage.test.tsx src/context/AuthProvider.test.tsx` → 7 tests passed | `npm run test` → 83/83; `npx tsc -b --noEmit` → success; `npm run lint` → 0 errors/1 pre-existing warning; `npm run build` → success; production grep showed only three allowed cleanup-only `removeItem("token")` paths | Revert `src/components/pages/ProductPage.tsx`, `src/components/pages/ProductPage.test.tsx`, and the OpenSpec artifact notes |

## Verification Summary

- ✅ `npx vitest run src/components/pages/LogInPage.test.tsx src/components/pages/SignUpPage.test.tsx src/components/elements/NavBar.test.tsx src/components/elements/WorkerSidebar.test.tsx src/services/user.test.ts src/api/index.test.ts src/context/AuthProvider.test.tsx` — 15 tests passed
- ✅ `npm run test` — 83 tests passed
- ✅ `npx tsc -b --noEmit` — passed
- ⚠️ `npm run lint` — passed with 1 pre-existing warning in `src/components/pages/CarritoPage.tsx:107` (`react-hooks/exhaustive-deps`)
- ✅ `npm run build` — passed; Vite reported a pre-existing chunk-size warning for the main bundle
- ✅ `rg -n "localStorage\.(get|set|remove)Item\([\"']token[\"']|/api/login/|/api/logout/" src --glob '!**/*.test.*'` — 3 cleanup-only `removeItem("token")` matches in `src/api/index.ts`, `src/services/auth.ts`, and `src/context/AuthProvider.tsx`; 0 forbidden production reads/writes or legacy login/logout endpoint matches

## Final Remediation Verification

- ✅ Focused tests: `npx vitest run src/components/pages/ProductPage.test.tsx src/context/AuthProvider.test.tsx` — 7/7 passed
- ✅ ProductPage now uses `getAccessToken()` for favoritos fetch/toggle authorization checks
- ✅ Full verification rerun: `npm run test` → 83/83, `npx tsc -b --noEmit` → success, `npm run lint` → 0 errors/1 pre-existing warning, `npm run build` → success
- ✅ Production token-policy grep: only cleanup-only `removeItem("token")` remains in `src/api/index.ts`, `src/services/auth.ts`, and `src/context/AuthProvider.tsx`

## Smoke Matrix Results

| Matrix Item | Result | Evidence |
|-------------|--------|----------|
| 1. Worker login flow | ✅ Covered via automated runtime-like UI test | `src/components/pages/LogInPage.test.tsx` proves JWT `login` + `getMe`, worker detection, redirect to `/worker`, and legacy `logIn` not called; verified in focused 15/15 run and full 81/81 run |
| 2. Regular login flow | ✅ Covered via automated runtime-like UI test | Same `LogInPage.test.tsx` proves regular user redirect to `/` after JWT login and no legacy login call |
| 3. Signup flow | ⚠️ Partially covered, no real backend mutation | `src/services/user.test.ts` proves backend `201` is accepted and JWT `login()` is established; `src/components/pages/SignUpPage.test.tsx` proves successful authenticated navigation. No real signup was executed to avoid mutating live/shared data without dedicated test credentials/environment |
| 4. Logout flow | ✅ Covered via component tests + production grep | `NavBar.test.tsx` and `WorkerSidebar.test.tsx` prove shared `services/auth.logout` is invoked with clear-auth + redirect callbacks; production grep found no `/api/logout/` references |
| 5. Profile update auth | ✅ Covered via service test | `src/services/user.test.ts` proves `updateUserData()` sends only `Accept` header and does not read legacy `token`; auth is delegated to the axios interceptor/access token |
| 6. Access guards / legacy token removal | ✅ Covered via test + production grep | `src/context/AuthProvider.test.tsx` proves legacy `token` alone does not bootstrap auth and logout now clears JWT keys plus stale legacy `token`; `src/components/pages/Home.test.tsx` proves token-only browser state skips authenticated favoritos loading; production grep found no `localStorage["token"]` reads/writes outside tests and three allowed cleanup removals |
| 7. Refresh flow via interceptor | ✅ Covered via deterministic regression tests | `src/api/index.test.ts` now executes the `token_not_valid` cleanup path, a successful non-`token_not_valid` refresh replay with a new Bearer token, and the refresh-failure logout cleanup path |

## Remaining Tasks

- None.

## Notes

- Production code no longer reads or writes `localStorage["token"]` for auth decisions; the only remaining production references are three explicit `removeItem("token")` cleanup paths and test-only regression fixtures.
- Direct browser/manual clicks were not performed in this batch because no controlled local browser/backend credential fixture was provided; local automated/runtime evidence was used instead wherever practical.
- Implementation matches the design; no new functional deviations were introduced during the smoke pass.
