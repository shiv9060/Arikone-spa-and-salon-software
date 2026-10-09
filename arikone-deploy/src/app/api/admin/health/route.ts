import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/services/platform/health.service';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const health = await getSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Health check failed' }, { status: 500 });
  }
}
