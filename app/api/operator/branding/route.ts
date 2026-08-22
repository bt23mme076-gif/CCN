import { NextResponse } from 'next/server';
import { getCurrentOperator } from '@/lib/db/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const op = await getCurrentOperator();
    if (!op) {
      return NextResponse.json({
        name: 'CCN Networks',
        logo_url: null,
        primary_color: '#6366f1',
        tagline: null,
        support_phone: null,
      });
    }

    return NextResponse.json({
      name: op.name,
      logo_url: op.logo_url,
      primary_color: op.primary_color ?? '#6366f1',
      tagline: op.tagline,
      support_phone: op.support_phone,
    });
  } catch {
    return NextResponse.json({ name: 'CCN Networks', logo_url: null, primary_color: '#6366f1', tagline: null, support_phone: null });
  }
}
