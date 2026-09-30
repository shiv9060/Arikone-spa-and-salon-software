# Data Export System

## Overview
The Arikone data export system securely streams reports into Excel, CSV, and PDF formats.

## Architecture
All exports use dedicated API routes (`/api/reports/export/*`). This ensures exports:
1. Cannot be maliciously generated from manipulated client-side DOM.
2. Accurately reflect server-side financial calculations.
3. Stream large datasets securely without crashing the client's browser.

## Formats
- **Excel (.xlsx)**: Primary structured format. Uses the robust `xlsx` (SheetJS) library. Creates multi-sheet workbooks when applicable (e.g., Revenue Summary + Payment Breakdown sheets).
- **CSV (.csv)**: Minimal string-delimited export. Handled securely by the same `xlsx` library to perfectly escape commas, quotes, and line breaks.
- **PDF (.pdf)**: Professional A4 documents using `pdfkit`.

## Security & Permissions
- Exports require the `REPORTS_EXPORT` role permission.
- The `tenantId` is exclusively pulled from the verified secure `session.tenantId`. Tenant context can never be spoofed by URL query parameters.
- Every successful export creates an immutable `AuditLog` entry, tracking the user, format, and report type.

## File Naming
Exports are cleanly named with the report type and execution date to prevent OS file conflicts:
`appointments-report-2026-09-29.xlsx`
