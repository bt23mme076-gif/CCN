import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOperator } from '@/lib/db/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const debug = request.nextUrl.searchParams.get('debug') === '1';
  const rawHeaders = debug
    ? {
        host: request.headers.get('host'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-operator-subdomain': request.headers.get('x-operator-subdomain'),
      }
    : undefined;

  try {
    const op = await getCurrentOperator();
    if (!op) {
      return NextResponse.json({
        name: 'Chandni Cable Network',
        logo_url: null,
        primary_color: '#6366f1',
        tagline: null,
        support_phone: null,
        ...(debug ? { debug: { resolved: null, rawHeaders } } : {}),
      });
    }

    return NextResponse.json({
      name: op.name,
      logo_url: op.logo_url,
      primary_color: op.primary_color ?? '#6366f1',
      tagline: op.tagline,
      support_phone: op.support_phone,
      ...(debug ? { debug: { resolved: { id: op.id, subdomain: op.subdomain }, rawHeaders } } : {}),
    });
  } catch (error) {
    return NextResponse.json({
      name: 'Chandni Cable Network',
      logo_url: null,
      primary_color: '#6366f1',
      tagline: null,
      support_phone: null,
      ...(debug ? { debug: { error: (error as Error).message, rawHeaders } } : {}),
    });
  }
}
