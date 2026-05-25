import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { announcements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, 'announcement_main'))
      .limit(1);

    if (result.length === 0 || !result[0].is_active) {
      return NextResponse.json({ announcement: null });
    }

    return NextResponse.json({ announcement: result[0] });
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ announcement: null });
  }
}
