# Authorization Architecture

## Roles & Permissions
Arikone enforces strict Role-Based Access Control (RBAC) via a centralized configuration matrix in `src/lib/auth/permissions.ts`.

### Roles
- `OWNER`: Full unrestricted access to the tenant.
- `MANAGER`: Operational access (dashboard, customers, appointments, services, billing, reporting) but denied critical business settings and user management.
- `RECEPTIONIST`: Front-desk access (dashboard, customers, appointments, front-line billing). Cannot access financial reports, settings, or staff administration.
- `STAFF`: Restricted access strictly to personal operational views (dashboard, customers, appointments, services). No billing or reporting visibility.

## Enforcement
Security is enforced entirely server-side.
- **Middleware**: The `middleware.ts` blockades unauthorized visitors from hitting `/dashboard/*` completely.
- **Server Actions / API**: The `requireAuth()` and `requirePermission()` helper functions must be executed at the very top of any sensitive action.
- Hiding UI components (like omitting a button if a user lacks permissions) is UX only, not security. The underlying Server Action will still reject the invocation if `hasPermission()` evaluates to false.

## Helpers
- `getCurrentUser()`: Fetches session payload, validates against DB for `isActive` and `tenantId` match, and returns safe user data.
- `requireAuth()`: Triggers a redirect to `/login` if not authenticated.
- `requirePermission()`: Asserts that the authenticated user's role contains the required permission, otherwise throws a `FORBIDDEN` error.
