export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-lg shadow border border-gray-100 text-center">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <p className="text-gray-600 mb-6">
          Password reset functionality will be implemented when the email service is integrated.
        </p>
        <a href="/login" className="text-indigo-600 font-medium hover:underline">
          Return to login
        </a>
      </div>
    </div>
  );
}
