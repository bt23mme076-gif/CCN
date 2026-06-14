import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accessories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeAccessories = await db
      .select()
      .from(accessories)
      .where(eq(accessories.is_active, true))
      .orderBy(accessories.price);

    return NextResponse.json(
      { accessories: activeAccessories },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Get accessories error:', error);
    return NextResponse.json({ error: 'Failed to fetch accessories' }, { status: 500 });
  }
}
