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

  // The CCN APK's WebView has been observed dropping the auth cookie after a
  // short time (not seen in regular browsers). As a fallback, the admin
  // frontend also keeps the token in localStorage and resends it as an
  // Authorization: Bearer header — accept that here and splice it into the
  // forwarded Cookie header so every downstream cookies()-based auth check
  // (route handlers, getCurrentUser(), etc.) sees it exactly as if the
  // cookie itself had arrived.
  const bearerToken = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (bearerToken && !request.cookies.get('auth_token')?.value) {
    const existingCookie = requestHeaders.get('cookie') ?? '';
    const withAuth = `${existingCookie}${existingCookie ? '; ' : ''}auth_token=${bearerToken}`;
    requestHeaders.set('cookie', withAuth);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Propagate the real client IP from Cloudflare.
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    response.headers.set('x-real-ip', cfIP);
  }

  // Admin APIs throw on missing auth, which their catch blocks turn into a 500.
  // Reject cookie-less requests here so logged-out callers get a 401 instead.
  // (login itself must be allowed through — it's how the cookie gets set)
  if (
    pathname.startsWith('/api/admin/') &&
    pathname !== '/api/admin/login' &&
    !request.cookies.get('auth_token')?.value &&
    !bearerToken
  ) {
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
