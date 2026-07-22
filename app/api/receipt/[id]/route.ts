import { NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers, customerConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateReceiptHTML } from '@/lib/receipt';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireCustomerAuth();

    const [recharge] = await db
      .select()
      .from(recharges)
      .where(and(eq(recharges.id, params.id), eq(recharges.customer_id, user.customerId)));

    if (!recharge) {
      return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });
    }

    if (recharge.status === 'pending' || recharge.status === 'failed') {
      return NextResponse.json({ error: 'Receipt not available for this recharge' }, { status: 400 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, user.customerId));

    let stb_number = customer.stb_number;
    let area = customer.area;
    if (recharge.connection_id) {
      const [conn] = await db
        .select()
        .from(customerConnections)
        .where(eq(customerConnections.id, recharge.connection_id));
      if (conn) { stb_number = conn.stb_number; area = conn.area || area; }
    }

    const html = generateReceiptHTML({
      recharge,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        stb_number,
        area,
      },
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
