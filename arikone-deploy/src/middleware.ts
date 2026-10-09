import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-for-development-only';
const encodedKey = new TextEncoder().encode(secretKey);
const SESSION_COOKIE = 'arikone_session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /dashboard and /admin subpaths
  if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ['HS256'],
      });
      
      // Check SUPER_ADMIN for /admin
      if (path.startsWith('/admin') && payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check tenant user for /dashboard
      if (path.startsWith('/dashboard') && payload.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      // Invalid session
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect root to dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/'],
};
