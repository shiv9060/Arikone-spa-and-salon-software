import prisma from '@/lib/db/prisma';

export async function getSystemHealth() {
  let dbStatus = 'UNAVAILABLE';
  let dbLatency = 0;
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = 'CONNECTED';
  } catch (e) {
    console.error('DB Health Check Failed:', e);
  }

  return {
    status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency
      },
      application: {
        status: 'RUNNING'
      }
    }
  };
}
