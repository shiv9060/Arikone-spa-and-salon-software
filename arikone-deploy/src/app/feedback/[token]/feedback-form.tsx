'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitFeedbackAction } from './actions';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FeedbackForm({ 
  token, 
  serviceName, 
  allowComments 
}: { 
  token: string;
  serviceName?: string;
  allowComments: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewLink, setReviewLink] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a rating' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('rating', rating.toString());
    if (comment) formData.append('comment', comment);

    try {
      const res = await submitFeedbackAction(token, formData);
      if (res.error) {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
      } else {
        setSubmitted(true);
        if (res.reviewLink) {
          setReviewLink(res.reviewLink);
        }
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
        <p className="text-gray-600">Your feedback helps us improve and serve you better.</p>
        
        {reviewLink && (
          <div className="pt-6 border-t mt-6">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Loved your experience? We'd appreciate a public review!
            </p>
            <a 
              href={reviewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center bg-indigo-600 text-white font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Leave a Review
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">How was your experience?</h2>
        {serviceName && <p className="text-sm text-gray-500">Service: {serviceName}</p>}
      </div>

      <div className="flex justify-center gap-2 my-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`transition-colors p-1 ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-200'
            }`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star className="w-10 h-10 fill-current" />
          </button>
        ))}
      </div>

      {allowComments && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 text-left">
            Tell us more (optional)
          </label>
          <Textarea 
            placeholder="What did you like? What can we improve?"
            className="w-full resize-none min-h-[100px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" className="w-full h-12 text-lg font-medium bg-indigo-600 hover:bg-indigo-700" disabled={loading || rating === 0}>
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
}
