import { requirePermission } from '@/lib/auth/auth-utils';
import { getFeedbackAnalytics, getFeedbackList } from '@/services/feedback-dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, MessageSquare, Clock } from 'lucide-react';
import { FeedbackTable } from '@/components/feedback/feedback-table';

export default async function FeedbackDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await requirePermission('FEEDBACK_VIEW');
  const params = await searchParams;
  
  const page = parseInt(params.page || '1', 10);
  const limit = 20;

  const [analytics, list] = await Promise.all([
    getFeedbackAnalytics(user.tenantId),
    getFeedbackList(user.tenantId, page, limit)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback & Reviews</h1>
        <p className="text-gray-500">Monitor customer satisfaction and recent feedback.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgRating}</div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">Responses received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate}%</div>
            <p className="text-xs text-muted-foreground">Of total requests sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting customer reply</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = analytics.distribution[star as keyof typeof analytics.distribution] || 0;
              const percentage = analytics.totalFeedback > 0 
                ? (count / analytics.totalFeedback) * 100 
                : 0;
                
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 text-sm text-gray-600">
                    {star} <Star className="h-3 w-3 fill-current text-yellow-500" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm text-gray-500">
                    {count}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackTable data={list.data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
