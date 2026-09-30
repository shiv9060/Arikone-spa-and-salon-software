import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {description && (
          <p className={cn(
            "mt-1 text-sm",
            trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-gray-500"
          )}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
