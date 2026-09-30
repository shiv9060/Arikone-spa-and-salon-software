export function TopServices({
  services,
}: {
  services: { id: string; name: string; bookings: number; revenue: number }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Top Services</h3>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">No service data available.</p>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-100">
              {services.map((service) => (
                <li key={service.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="truncate text-sm text-gray-500">{service.bookings} bookings</p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        ₹{service.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
