# auth Specification

## Purpose

Define the frontend auth contract after removing legacy token behavior. The system MUST use JWT `access`/`refresh` as the only supported session model.

## Requirements

### Requirement: JWT-only login flow

The system MUST complete login using the JWT auth endpoints and MUST NOT invoke the legacy login flow after JWT login succeeds.

#### Scenario: worker user logs in successfully
- GIVEN a worker submits valid credentials
- WHEN JWT login and user fetch succeed
- THEN the session is established from `access` and `refresh`
- AND the user is routed to the worker experience

#### Scenario: regular user logs in successfully
- GIVEN a regular user submits valid credentials
- WHEN JWT login and user fetch succeed
- THEN the session is established from `access` and `refresh`
- AND the user is routed to the customer experience

#### Scenario: legacy login is not called after JWT login
- GIVEN JWT login already succeeded
- WHEN the login flow continues
- THEN the frontend MUST NOT call `/api/login/`

### Requirement: JWT-only registration flow

The system MUST treat successful signup as a JWT-only flow and SHALL accept the backend create response used by the current API.

#### Scenario: signup accepts backend 201 response
- GIVEN a new user submits valid registration data
- WHEN the backend responds with HTTP 201
- THEN the frontend treats signup as successful

#### Scenario: signup establishes JWT session after registration
- GIVEN signup succeeded
- WHEN the authenticated post-signup flow runs
- THEN the frontend establishes a JWT session for the new user

#### Scenario: signup does not call legacy login
- GIVEN signup succeeded
- WHEN session establishment completes
- THEN the frontend MUST NOT call `/api/login/`

### Requirement: JWT-only logout flow

The system MUST clear JWT auth state consistently from every logout entry point and MUST NOT depend on the legacy logout endpoint.

#### Scenario: navbar logout clears JWT auth state and redirects
- GIVEN an authenticated user logs out from the NavBar
- WHEN logout completes
- THEN `access`, `refresh`, and cached user state are cleared
- AND the user is redirected away from the authenticated experience

#### Scenario: worker sidebar logout clears auth state consistently
- GIVEN an authenticated worker logs out from the WorkerSidebar
- WHEN logout completes
- THEN the same auth state is cleared as NavBar logout

#### Scenario: logout does not call backend legacy logout endpoint
- GIVEN any frontend logout entry point
- WHEN logout executes
- THEN the frontend MUST NOT call `/api/logout/`

### Requirement: Authenticated profile update

Authenticated profile requests MUST use the JWT authorization mechanism already owned by the shared axios interceptor.

#### Scenario: profile update uses JWT Authorization via the axios interceptor
- GIVEN an authenticated user updates profile data
- WHEN the update request is sent
- THEN the request carries JWT authorization from the shared interceptor

#### Scenario: profile update does not depend on legacy `token`
- GIVEN the user is authenticated through `access`
- WHEN profile update executes
- THEN the flow succeeds without requiring localStorage `token`

### Requirement: Legacy token removal

The system MUST remove legacy localStorage token dependencies from frontend auth state, guards, and session management.

#### Scenario: authentication guards check `access` only
- GIVEN frontend auth guards evaluate session state
- WHEN they check client storage
- THEN they rely on `access` and MUST NOT require `token`

#### Scenario: no code writes or requires localStorage `token`
- GIVEN the frontend auth flows are implemented
- WHEN the codebase is inspected
- THEN no auth path writes or requires localStorage `token`
