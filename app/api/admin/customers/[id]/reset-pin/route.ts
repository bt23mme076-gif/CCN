import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const customerId = params.id;

    const { pin } = await request.json();
    if (!pin || !/^\d{4,}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be at least 4 digits' },
        { status: 400 }
      );
    }

    // 1. Verify customer exists
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 2. Hash new PIN and update
    const newPinHash = await bcrypt.hash(pin, 10);
    await db
      .update(customers)
      .set({
        pin_hash: newPinHash,
      })
      .where(eq(customers.id, customerId));

    return NextResponse.json({ success: true, message: 'Customer PIN reset successfully' });
  } catch (error) {
    console.error('Admin reset pin error:', error);
    return NextResponse.json(
      { error: 'Failed to reset customer PIN' },
      { status: 500 }
    );
  }
}
