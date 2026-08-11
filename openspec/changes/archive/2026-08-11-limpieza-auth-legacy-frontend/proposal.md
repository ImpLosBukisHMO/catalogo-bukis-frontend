# Proposal: limpieza-auth-legacy-frontend

## Intent

Remove the frontend's legacy dual-auth behavior and make JWT (`access`/`refresh`) the only supported session model. This change restores broken worker login, signup, profile save, and logout consistency without changing backend contracts.

## Problem

- Worker login succeeds on JWT, then calls the legacy `/api/login/` path, which wipes `access` and breaks the session.
- Signup treats backend `201 Created` as failure and never completes the happy path.
- Profile update reads the legacy `token` key, sending invalid auth for JWT-only users.
- Several guards and logout paths still depend on the legacy `token` branch.

## Scope

### In Scope

- Remove frontend usage of legacy `token`, `logIn`, and `logOut` flows.
- Keep login, signup, profile update, guards, and logout on JWT only.
- Update auth-related pages, services, context, interceptor, and logout entry points.

### Out of Scope

- Backend endpoint changes.
- UI redesign.
- JWT refresh redesign.
- New test framework installation.

## Capabilities

### New Capabilities

- `auth`: consolidated JWT-only frontend authentication behavior for login, signup, logout, profile updates, and session guards.

## Affected Areas

| Area | Impact |
|------|--------|
| `catalogo-bukis-frontend/catalogo-frontend/src/services/auth.ts` | Modified |
| `catalogo-bukis-frontend/catalogo-frontend/src/services/user.ts` | Modified |
| `catalogo-bukis-frontend/catalogo-frontend/src/api/index.ts` | Modified |
| `catalogo-bukis-frontend/catalogo-frontend/src/context/AuthProvider.tsx` | Modified |
| `catalogo-bukis-frontend/catalogo-frontend/src/components/pages/{LogInPage,SignUpPage,Home,ProductPage,PedidoDetallePage,MisPedidosPage,FavoritosPage,SearchProductsPage,ProfilePage}.tsx` | Modified |
| `catalogo-bukis-frontend/catalogo-frontend/src/components/elements/{NavBar,WorkerSidebar}.tsx` | Modified |

## Success Criteria

- Worker users can log in and stay authenticated.
- Signup accepts backend 201 and establishes a JWT session.
- Profile updates succeed for JWT-authenticated users.
- NavBar and WorkerSidebar logout clear the same JWT auth state.
- No frontend code writes or requires `localStorage["token"]`.

## Rollback Plan

Revert the frontend PR. This is a client-only cleanup with no data migration and no backend dependency changes.
