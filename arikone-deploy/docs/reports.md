# Reports & Analytics Module

## Overview
The Reports & Analytics module provides production-grade financial, operational, and customer insights for Arikone Salon & Spa Manager. It strictly respects multi-tenant boundaries and RBAC permissions.

## Features & Reports

1. **Summary Report**: Overarching KPIs across revenue, customers, and appointments.
2. **Revenue & Billing**: Gross billing, net billing, taxes, discounts, collected revenue, and outstanding payments. Uses snapshot pricing and actual finalized invoices to ensure 100% historical accuracy.
3. **Customers**: New vs Active vs Archived counts, and a table of top customers with total lifetime spending.
4. **Appointments**: Status breakdowns (Confirmed, Completed, No-Show, Cancelled) and completion rates.
5. **Services**: Service performance sorted by bookings or revenue.
6. **Staff**: Staff performance sorted by completed appointments and revenue generated.

## Definitions
- **Net Billing**: The sum of all finalized invoice totals for the period.
- **Collected Revenue**: Actual monetary payments received (Payment table records).
- **Outstanding**: Total valid finalized invoice balances remaining unpaid across all time.
- **Completion Rate**: `Completed / (Total - Cancelled - No Shows)`

## Date Ranges & Timezones
- All date queries convert the chosen logical period (e.g., "This Month") into exact UTC boundaries based upon the **Tenant's Local Timezone** (`tenant.timezone`). 
- This guarantees that an invoice issued at 11:55 PM local time appears in the correct reporting day, regardless of where the physical server is hosted.

## Permissions
- `REPORTS_VIEW`: Base permission to access the reports dashboard.
- `REPORTS_FINANCIAL`: Required to view Revenue, Billing, Service Revenue, and Staff Revenue tabs.
- `REPORTS_EXPORT`: Required to download Excel, CSV, or PDF files.
