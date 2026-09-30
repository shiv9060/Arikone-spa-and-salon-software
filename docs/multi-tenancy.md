# Multi-Tenancy Architecture

## 1. What is a tenant?
A tenant is an independent business (e.g., Looks Salon or Premium Spa). They are registered in our `Tenant` model. All their data (customers, staff, invoices) is strictly scoped to their `tenantId`.

## 2. How tenant isolation works
Every model containing tenant data has a `tenantId` field and a relation to the `Tenant` model.
All database queries must explicitly include a `where: { tenantId }` clause. 
The abstraction `withTenant(tenantId)` from `src/lib/tenant/tenant-query.ts` can be used to mix in the required filter easily.

## 3. How tenant context will be obtained
When an API request or server action is made, the application will determine the current tenant from the authenticated user's session token.
`getCurrentTenant()` in `tenant-context.ts` serves this purpose.

## 4. Why client-provided tenant IDs cannot be trusted
Never trust a `tenantId` passed in an HTTP payload or query string. A malicious user could change this ID to view another tenant's data. We always extract the `tenantId` natively from the trusted authentication token created during login.

## 5. How cross-tenant relationships are prevented
Before creating a relationship (e.g., an Appointment connecting Customer A and Staff B), the service layer must ensure both entities belong to the same tenant.
The `assertTenantOwnership()` function in `src/lib/tenant/tenant-guard.ts` can be used in the service layer to validate fetched records before mutations.

## 6. Authentication Context Pipeline
When a user logs in, the relationship flows securely from database to session:
1. **User Login**: User authenticates with email/password.
2. **Database Lookup**: The server fetches the user's `tenantId` strictly from the database.
3. **Session Encoding**: The `tenantId` is encoded securely into an `HttpOnly` JWT cookie.
4. **Context Provisioning**: Helper functions like `getCurrentUser()` and `getCurrentTenant()` pull the `tenantId` out of the verified JWT.
5. **Database Execution**: The `tenantId` is passed into `withTenant(tenantId)` to scope all database reads/writes.

The client **cannot** select another tenant or manipulate the context.
