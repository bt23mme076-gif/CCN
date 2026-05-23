import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Customer routes protection
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/plans')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'customer') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/plans/:path*', '/admin/:path*'],
};
