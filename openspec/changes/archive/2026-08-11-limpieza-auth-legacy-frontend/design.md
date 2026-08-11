# Design: limpieza-auth-legacy-frontend

## Summary

This is a surgical auth cleanup, not a redesign. The frontend MUST treat JWT `access`/`refresh` as the only session source, delete legacy login/logout usage, and rely on the existing auth interceptor as the single place that injects `Authorization`.

## Key Decisions

| Decision | Outcome |
|----------|---------|
| Single auth model | Remove legacy `token`, `logIn`, and `logOut` usage from the frontend |
| Logout contract | `services/auth.ts` owns logout state cleanup and supports caller-provided auth-state clearing |
| Signup behavior | Accept backend `200` or `201`, then establish JWT session once |
| Auth headers | `user.ts` authenticated calls stop building manual headers and rely on the axios interceptor |
| Guards | Inline `access ?? token` checks collapse to `access` only |

## Flow Changes

1. **Login**: `LogInPage` calls JWT login, resolves the current user, routes by role, and MUST NOT call the legacy login endpoint afterward.
2. **Signup**: `signUp` accepts the backend create response, then MUST establish a JWT session without any legacy fallback.
3. **Logout**: NavBar, WorkerSidebar, and interceptor-driven logout all clear `access`, `refresh`, and cached user state consistently.
4. **Profile update**: authenticated user reads/writes use the interceptor-provided JWT header only.

## Affected Files

- `src/services/auth.ts`
- `src/services/user.ts`
- `src/api/index.ts`
- `src/context/AuthProvider.tsx`
- `src/components/pages/LogInPage.tsx`
- `src/components/pages/SignUpPage.tsx`
- `src/components/pages/ProfilePage.tsx`
- `src/components/pages/Home.tsx`
- `src/components/pages/ProductPage.tsx`
- `src/components/pages/PedidoDetallePage.tsx`
- `src/components/pages/MisPedidosPage.tsx`
- `src/components/pages/FavoritosPage.tsx`
- `src/components/pages/SearchProductsPage.tsx`
- `src/components/elements/NavBar.tsx`
- `src/components/elements/WorkerSidebar.tsx`
- `src/components/elements/NavBar.test.tsx`

## Verification Plan

- Confirm legacy `token` reads/writes are removed from frontend auth paths.
- Confirm worker login, signup, profile update, NavBar logout, and WorkerSidebar logout follow JWT-only behavior.
- Run lightweight gates only: file presence plus optional SDD status check.
