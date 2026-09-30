'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function RevenueTrendChart({ data }: { data: { date: string; amount: number }[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
          <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentModesChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) return <div className="p-4 text-center text-muted-foreground">No data available</div>;

  const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

  return (
    <div className="h-[300px] w-full flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarTrendChart({ data, xKey, yKey, color = "#3b82f6", yFormatter }: { data: Array<Record<string, unknown>>, xKey: string, yKey: string, color?: string, yFormatter?: (val: any) => string }) {
  if (!data || data.length === 0) return <div className="p-4 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={yFormatter} tick={{ fontSize: 12 }} />
          <Tooltip formatter={yFormatter ? (val: any) => yFormatter(val) : undefined} />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
