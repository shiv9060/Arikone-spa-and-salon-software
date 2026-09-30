import { Plus } from "lucide-react";
import Link from "next/link";
import { hasPermission, RoleType, Permission } from "@/lib/auth/permissions";

export function QuickActions({ role }: { role: string }) {
  const actions = [
    {
      name: "New Customer",
      href: "/dashboard/customers/new",
      permission: "CUSTOMERS_CREATE",
    },
    {
      name: "New Appointment",
      href: "/dashboard/appointments/new",
      permission: "APPOINTMENTS_CREATE",
    },
    {
      name: "Create Bill",
      href: "/dashboard/billing/new",
      permission: "BILLING_CREATE",
    },
  ];

  const allowed = actions.filter((a) => hasPermission(role as RoleType, a.permission as Permission));

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {allowed.map((action) => (
        <Link
          key={action.name}
          href={action.href}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          {action.name}
        </Link>
      ))}
    </div>
  );
}
