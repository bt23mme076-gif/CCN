import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { advertisements } from '@/lib/db/schema';
import { eq, and, or, isNull, gt } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date();
    const ads = await db
      .select({
        id: advertisements.id,
        business_name: advertisements.business_name,
        image_data: advertisements.image_data,
        phone: advertisements.phone,
      })
      .from(advertisements)
      .where(
        and(
          eq(advertisements.is_active, true),
          or(isNull(advertisements.expires_at), gt(advertisements.expires_at, now))
        )
      )
      .orderBy(advertisements.created_at);

    return NextResponse.json({ advertisements: ads });
  } catch (error) {
    console.error('GET /api/advertisements error:', error);
    return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
  }
}
