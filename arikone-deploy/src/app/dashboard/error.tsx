'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const isForbidden = error.message.includes('FORBIDDEN');

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-red-50 p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isForbidden ? 'Access Denied' : 'Something went wrong!'}
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        {isForbidden 
          ? "You don't have permission to view this page or perform this action." 
          : "Unable to load dashboard data. An unexpected error occurred."}
      </p>
      <div className="flex gap-4">
        {!isForbidden && (
          <button
            onClick={() => reset()}
            className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Try again
          </button>
        )}
        <Link 
          href="/dashboard"
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
