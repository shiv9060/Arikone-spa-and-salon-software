'use client';

import { useActionState } from 'react';
import { registerAction } from './actions';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your Arikone account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Get started with your free salon & spa workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" action={formAction}>
            
            {state?.error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <div className="mt-1">
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  placeholder="My Awesome Salon"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Your Full Name
              </label>
              <div className="mt-1">
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? 'Creating workspace...' : 'Register'}
              </button>
            </div>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
