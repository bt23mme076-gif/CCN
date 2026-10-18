import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { streamAdPackages } from '@/lib/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { requireOperator } from '@/lib/db/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const operator = await requireOperator();
    const packages = await db
      .select({
        id: streamAdPackages.id,
        ad_type: streamAdPackages.ad_type,
        name: streamAdPackages.name,
        description: streamAdPackages.description,
        price: streamAdPackages.price,
        duration_days: streamAdPackages.duration_days,
      })
      .from(streamAdPackages)
      .where(and(eq(streamAdPackages.operator_id, operator.id), eq(streamAdPackages.is_active, true)))
      .orderBy(asc(streamAdPackages.price));
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('GET /api/stream-ads/packages error:', error);
    return NextResponse.json({ error: 'Failed to load packages' }, { status: 500 });
  }
}
