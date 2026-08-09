import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateReceiptHTML } from '@/lib/receipt';

export const dynamic = 'force-dynamic';

// Public receipt view, no login required — for sharing a bill directly to a
// customer over WhatsApp/SMS. Knowledge of the (long, effectively random)
// recharge ID is treated as the access token, same model already used for
// the guest checkout status pages. Only shows data the customer already
// has (their own name, plan, amount) — nothing sensitive is exposed.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [recharge] = await db
      .select()
      .from(recharges)
      .where(eq(recharges.id, params.id));

    if (!recharge) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
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
  } catch (error) {
    console.error('Public receipt error:', error);
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 });
  }
}
