import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-gray-100 p-6 mb-6">
        <SearchX className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        We couldn&apos;t find the page you&apos;re looking for in the dashboard. It might have been moved or doesn&apos;t exist.
      </p>
      <Link 
        href="/dashboard"
        className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
