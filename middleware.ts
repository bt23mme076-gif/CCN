import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extracts the leftmost subdomain segment from the hostname.
// ccn.atyant.in       → 'ccn'
// op2.atyant.in       → 'op2'
// localhost           → 'ccn'  (dev fallback)
function extractSubdomain(hostname: string): string {
  const host = hostname.split(':')[0]; // strip port
  const parts = host.split('.');
  // If only one segment (e.g. 'localhost') or a raw IP, fall back to ccn.
  if (parts.length <= 2) return process.env.DEFAULT_OPERATOR_SUBDOMAIN ?? 'ccn';
  return parts[0];
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);

  // Resolve tenant subdomain and forward it so server components and API
  // routes can call getCurrentOperator() without touching the hostname again.
  const subdomain = extractSubdomain(request.headers.get('host') ?? '');
  requestHeaders.set('x-operator-subdomain', subdomain);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Propagate the real client IP from Cloudflare.
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    response.headers.set('x-real-ip', cfIP);
  }

  // Admin APIs throw on missing auth, which their catch blocks turn into a 500.
  // Reject cookie-less requests here so logged-out callers get a 401 instead.
  if (pathname.startsWith('/api/admin/') && !request.cookies.get('auth_token')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protect customer routes.
  if (pathname.startsWith('/dashboard') || (pathname.startsWith('/plans') && pathname !== '/plans')) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
