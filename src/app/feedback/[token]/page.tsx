import { getFeedbackRequestData } from './actions';
import { notFound } from 'next/navigation';
import { FeedbackForm } from './feedback-form';

export default async function FeedbackPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const request = await getFeedbackRequestData(params.token);

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">The feedback link is invalid or could not be found.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > request.expiresAt;
  const isResponded = request.status === 'RESPONDED' || request.respondedAt;

  if (isExpired && !isResponded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500">This feedback link has expired.</p>
        </div>
      </div>
    );
  }

  if (isResponded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-500">Your feedback has already been submitted.</p>
        </div>
      </div>
    );
  }

  const salonName = request.tenant.settings?.displayName || request.tenant.name;
  const serviceName = request.service?.name;
  const settings = request.tenant.settings?.feedbackSettings as any;
  const allowComments = settings?.allowComments ?? true;

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-12 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm max-w-md w-full overflow-hidden">
        <div className="bg-indigo-600 px-6 py-8 text-center text-white">
          <h1 className="text-2xl font-bold">{salonName}</h1>
          <p className="mt-2 text-indigo-100 opacity-90">We value your experience</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <FeedbackForm 
            token={params.token} 
            serviceName={serviceName} 
            allowComments={allowComments} 
          />
        </div>
      </div>
    </div>
  );
}
