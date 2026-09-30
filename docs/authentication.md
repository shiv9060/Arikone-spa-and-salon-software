# Authentication Architecture

## Overview
Arikone uses a custom, secure JSON Web Token (JWT) based session architecture via `jose`. NextAuth/Auth.js was deliberately bypassed to preserve strict control over the custom multi-tenant Prisma schema without conforming to generic, un-isolated adapters.

## Core Flow
1. User submits email & password via `/login` Server Action (`actions.ts`).
2. Server queries the `User` model, verifying existence, `isActive` status, and tenant membership.
3. Password verified securely against the stored hash using `argon2`.
4. The server creates a signed JWT containing: `userId`, `tenantId`, `role`, `name`, `email`, `tenantName`.
5. The JWT is sealed into an `HttpOnly`, `Secure` cookie named `arikone_session`.

## Session Strategy
- **Client Side**: Client code cannot read the token directly. It's completely secure from XSS.
- **Server Side**: The Next.js middleware and Server Actions read the cookie, decode it using `jose` and the symmetric `SESSION_SECRET`.
- **Invalidation**: 
  - Logouts immediately clear the cookie.
  - Active session checks (e.g., `getCurrentUser()`) always re-verify against the database to ensure the user is still `isActive`. This means if a user is deactivated by an admin, their active session is immediately blocked on the next protected request.

## Password Security
- Passwords are strictly hashed with `argon2` during seeding/creation. 
- `passwordHash` is never returned in any API response or UI payload.
- Generic error messages like "Invalid email or password" prevent account enumeration.

## Audit Logging
Important authentication events like `LOGIN_SUCCESS`, `LOGIN_FAILED`, and `LOGOUT` are tracked in the `AuditLog` model to maintain security compliance for the tenant.

## Password Reset (Future Architecture)
- A secure reset token will be generated, stored in a temporary database table (or User model), and emailed.
- Clicking the link verifies the token, allows a new password, and strictly forces a new `argon2` hash generation while invalidating all current sessions.
