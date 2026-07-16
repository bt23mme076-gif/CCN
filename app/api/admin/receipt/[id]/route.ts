import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateReceiptHTML } from '@/lib/receipt';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const [recharge] = await db
      .select()
      .from(recharges)
      .where(eq(recharges.id, params.id));

    if (!recharge) {
      return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, recharge.customer_id));

    const html = generateReceiptHTML({
      recharge,
      customer: customer
        ? {
            name: customer.name,
            mobile: customer.mobile,
            stb_number: customer.stb_number,
            area: customer.area,
          }
        : { name: 'Unknown', mobile: '—', stb_number: '—', area: '—' },
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
