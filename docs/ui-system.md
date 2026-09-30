# Arikone UI System Architecture

## Overview
The UI system for Arikone is built using Next.js 14 App Router, TailwindCSS, and shadcn/ui components. It prioritizes readability, scanability, and a premium, professional "SaaS" aesthetic devoid of excessive fluff or AI-generated template appearances.

## Layout Structure
The application shell utilizes a classic Sidebar + Header layout on desktop, transitioning to a responsive Drawer (Sheet) on mobile viewports.

1. **App Shell**: The main authenticated layout (`src/app/dashboard/layout.tsx`) wraps all dashboard routes.
2. **Sidebar**: Found in `src/components/layout/sidebar.tsx`, providing consistent navigation. Evaluates `userRole` to conditionally hide unauthorized routes.
3. **Header**: Found in `src/components/layout/header.tsx`, housing the global search, notifications, mobile menu toggle, and the `UserMenu` profile dropdown.
4. **Mobile Navigation**: Implemented using shadcn's `Sheet` component for seamless transitions without layout shifting.

## Dashboard Architecture
The `src/app/dashboard/page.tsx` aggregates metrics using a parallelized fetching strategy:
```typescript
const [stats, upcomingAppointments, topServices] = await Promise.all([ ... ]);
```
All fetches route through `src/services/dashboard.service.ts`, ensuring strict `tenantId` boundaries are applied to every single database query.

## Theming & Colors
- **Primary**: Deep Charcoal/Indigo (`bg-gray-900`, `text-indigo-600` for accents).
- **Secondary**: Neutral warm grays (`gray-50`, `gray-100`, `gray-500` for text).
- **Architecture Prep**: Custom branding is prepared by utilizing centralized classes and extracting complex logic. Shadcn uses CSS variables (`--primary`, `--ring`, etc.) which can be overridden dynamically based on `TenantSettings` in future chunks.

## Responsive Breakpoints
- **Mobile** (`< 640px`): Single-column grids, sidebar moves into `Sheet`, tables use horizontal scrolling.
- **Tablet** (`640px - 1024px`): 2-column KPI grids.
- **Desktop** (`> 1024px`): Persistent sidebar, 3-column KPI grids, side-by-side data tables.

## Data Display & Empty States
No data is ever "faked". If the `dashboard.service.ts` returns 0 for revenue, `0` is shown. If there are no upcoming appointments, a professional "No upcoming appointments" state is rendered rather than an empty box. Loading states are managed via `loading.tsx` using `Skeleton` from shadcn to prevent layout jitter.
