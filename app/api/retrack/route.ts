import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { retrackRequests, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendPushToAdmin } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json().catch(() => ({}));

    const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
    if (customer.length === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const c = customer[0];
    await db.insert(retrackRequests).values({
      id: `ret_${randomBytes(8).toString('hex')}`,
      customer_id: c.id,
      customer_name: c.name,
      stb_number: body.stb_number || c.stb_number,
      mobile: c.mobile,
      status: 'pending',
    });

    sendPushToAdmin({
      title: '📺 Retrack Request',
      body: `${c.name} (STB: ${body.stb_number || c.stb_number}) ne retrack request bheja`,
      url: '/admin/retrack',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Retrack request error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
