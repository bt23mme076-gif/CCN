import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Propagate the real client IP from Cloudflare so server-side code
  // sees the visitor's IP instead of Cloudflare's edge node IP.
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    response.headers.set('x-real-ip', cfIP);
  }

  // Only protect customer routes in middleware
  // Admin routes are protected in the layout
  if (pathname.startsWith('/dashboard') || (pathname.startsWith('/plans') && pathname !== '/plans')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/plans/:path*'],
};
