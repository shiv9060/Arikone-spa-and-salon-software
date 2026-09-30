# Database Architecture

## Overview
Arikone uses a **PostgreSQL** database managed by **Prisma ORM**. The architecture is heavily optimized for a **multi-tenant SaaS** where data for different salons/spas are stored in the same database but strictly isolated by `tenantId`.

## Core Models

### 1. Tenant
Represents the business unit (e.g., a salon or spa). All tenant-owned records have a mandatory `tenantId` field pointing to this record.
- **Tenant Isolation**: Achieved strictly using `tenantId` indexed fields across models.

### 2. User & Staff
- **User**: Authentication representation for access to the SaaS.
- **Staff**: The physical employees or therapists in the business. A staff member might optionally have a User record to log in.

### 3. Customer
Customers of the business. 
- Fast search enabled via indexing on `mobile` and `name` combined with `tenantId`.

### 4. ServiceCategory & Service
Configurable services offered by the tenant.
- Uses `Decimal` type to prevent float rounding errors.

### 5. Appointment
Connects Customer, Service, and Staff at a given time.

### 6. Invoice & InvoiceItem
Financial records.
- **Invoice Snapshots**: The `InvoiceItem` model records `unitPrice`, `taxPercent`, and `serviceName` at the time of invoice creation so historical invoices are preserved even if the underlying `Service` is modified or deleted.

### 7. Payment
Transactions for an invoice. Can handle partial or split payments.

### 8. AuditLog
Action tracking (creations, deletions, refunds) scoped by `tenantId`.

## Important Strategies

### Tenant Isolation
- We do not use row-level security (RLS) currently, but we strictly enforce application-level multi-tenancy.
- Every API endpoint or Service function **must** receive the `tenantId` and include it in its Prisma `where` clause.
- See `multi-tenancy.md` for more details.

### Financial Data Handling
- Money values are stored as `Decimal` in Prisma (mapping to `Decimal(10, 2)` in PostgreSQL).
- Never use JavaScript `Number` (floats) for direct aggregation; use the Prisma Decimal type or a dedicated decimal library.

### Soft Deletion / Deactivation
- Business-critical entities (Staff, Services) use `isActive` and `StaffStatus` to hide entities instead of physically deleting them to maintain referential integrity with historical invoices and appointments.

### Index Strategy
- Compound indexes with `tenantId` are heavily utilized, ensuring fast retrieval when filtering by tenant context. For example: `@@index([tenantId, mobile])` on Customers.
