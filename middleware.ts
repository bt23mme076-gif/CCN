import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect customer routes in middleware
  // Admin routes are protected in the layout
  if (pathname.startsWith('/dashboard') || (pathname.startsWith('/plans') && pathname !== '/plans')) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/plans/:path*'],
};
