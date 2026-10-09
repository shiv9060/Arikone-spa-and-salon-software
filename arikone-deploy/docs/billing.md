# Billing & Financial Module (CHUNK 08)

## Overview
The Billing & Financial module introduces a complete invoicing and payment tracking system designed around production SaaS standards, handling financial calculations reliably using `Prisma.Decimal` to avoid floating-point inaccuracies.

## Architecture

1. **Schema Additions (`prisma/schema.prisma`)**
   - Added `InvoiceStatus` enum: `DRAFT`, `FINALIZED`, `CANCELLED`.
   - Updated `Invoice` model with robust tracking: `status`, `paymentStatus`, `invoiceNumber`.
   - Included snapshot fields for tenant and customer details: `businessNameSnapshot`, `businessAddressSnapshot`, `customerNameSnapshot`, `customerMobileSnapshot`. This ensures invoices remain immutable and historically accurate even if user profiles or business names change.

2. **Service Layer (`src/services/billing.service.ts`)**
   - Centralized financial calculations ensuring source of truth remains on the backend.
   - Core functions:
     - `createInvoice`: Takes `customerId`, `items`, etc., recalculates totals against DB service prices, and creates a `DRAFT` invoice.
     - `finalizeInvoice`: Transitions an invoice from `DRAFT` to `FINALIZED`. Assigns sequential, transaction-safe `invoiceNumber` (e.g., `INV-0001`).
     - `cancelInvoice`: Cancels `DRAFT` or `FINALIZED` invoices.
     - `createPayment`: Records a payment and calculates if the invoice is `PAID` or `PARTIAL`. Prevents overpayment.

3. **PDF Generation (`src/app/api/billing/[invoiceId]/pdf/route.ts`)**
   - Server-side PDF generation using `pdfkit`.
   - Streams PDF directly to the browser for download/print.
   - Includes full breakdown, line-item discounts, taxes, and payment history.

4. **UI Components**
   - `BillingTable`: Lists all invoices with pagination and status badges.
   - `BillingFilters`: URL-param based filters for status and search.
   - `InvoiceForm`: Dynamic form using `react-hook-form` and `useFieldArray` to add multiple services with client-side preview calculations.
   - `PaymentDialog`: Modal for recording partial or full payments safely.

## Integrations
- **Customer CRM (`/dashboard/customers/[customerId]`)**: Updated to display the `BillingTable` for full history and calculating total spending using actual valid invoices.
- **Appointments (`/dashboard/appointments/[appointmentId]`)**: A `COMPLETED` appointment now includes a "Generate Bill" action that auto-fills customer and service data into the new invoice form.
- **Dashboard (`/dashboard`)**: KPI metrics for 'Total Bills', 'Pending Payments', and 'Today's Revenue' are now powered by actual DB `Invoice` and `Payment` data.

## Important Business Rules
- **Decimal Logic**: Financial totals are ALWAYS stored and computed using `Prisma.Decimal` (mapped to Postgres `NUMERIC`).
- **Immutability**: Once an invoice is `FINALIZED`, it cannot be freely updated. If corrections are needed, it must be `CANCELLED` and re-issued.
- **Tenant Isolation**: ALL queries filter by `tenantId`.

## Pending Steps (For User)
- Ensure PostgreSQL is running.
- Execute `npx prisma db push` or `npx prisma migrate dev` to push the new Schema modifications.
