import 'server-only';
import prisma from '@/lib/db/prisma';

export async function getFeedbackAnalytics(tenantId: string) {
  const [totalFeedback, ratingsDistribution, totalRequests] = await Promise.all([
    prisma.customerFeedback.count({ where: { tenantId } }),
    prisma.customerFeedback.groupBy({
      by: ['rating'],
      where: { tenantId },
      _count: { rating: true }
    }),
    prisma.feedbackRequest.count({ where: { tenantId } })
  ]);

  let avgRating = 0;
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  ratingsDistribution.forEach((r) => {
    dist[r.rating as keyof typeof dist] = r._count.rating;
    sum += (r.rating * r._count.rating);
  });

  if (totalFeedback > 0) {
    avgRating = sum / totalFeedback;
  }

  const responseRate = totalRequests > 0 ? (totalFeedback / totalRequests) * 100 : 0;
  
  const pendingRequests = await prisma.feedbackRequest.count({
    where: { 
      tenantId, 
      status: { in: ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED'] }
    }
  });

  return {
    totalFeedback,
    avgRating: avgRating.toFixed(1),
    responseRate: responseRate.toFixed(1),
    pendingRequests,
    distribution: dist
  };
}

export async function getFeedbackList(tenantId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma.customerFeedback.findMany({
      where: { tenantId },
      include: {
        customer: { select: { name: true, mobile: true } },
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.customerFeedback.count({ where: { tenantId } })
  ]);
  
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
