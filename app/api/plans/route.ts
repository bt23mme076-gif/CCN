import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.is_active, true))
      .orderBy(plans.price);

    return NextResponse.json({ plans: activePlans });
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
