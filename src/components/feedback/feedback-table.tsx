'use client';

import { Star } from 'lucide-react';
import { format } from 'date-fns';

export function FeedbackTable({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No feedback received yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">Comment</th>
            <th className="px-4 py-3">Service & Staff</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{item.customer.name}</div>
                <div className="text-xs text-gray-500">{item.customer.mobile}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-current' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                {item.comment ? (
                  <p className="text-gray-600 truncate" title={item.comment}>{item.comment}</p>
                ) : (
                  <span className="text-gray-400 italic">No comment</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                <div className="text-xs">{item.service?.name || '-'}</div>
                <div className="text-xs text-gray-400">{item.staff?.name || '-'}</div>
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {format(new Date(item.createdAt), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
