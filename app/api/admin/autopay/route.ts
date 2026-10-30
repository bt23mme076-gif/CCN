import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { autopaySubscriptions, customerConnections, customers } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// All AutoPay rows for this operator. QR images are left out of the list (they
// are large); `has_qr` says whether one has been uploaded.
export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const rows = await db
      .select({
        id: autopaySubscriptions.id,
        plan_name: autopaySubscriptions.plan_name,
        amount: autopaySubscriptions.amount,
        mandate_name: autopaySubscriptions.mandate_name,
        mandate_mobile: autopaySubscriptions.mandate_mobile,
        mandate_months: autopaySubscriptions.mandate_months,
        status: autopaySubscriptions.status,
        next_debit_date: autopaySubscriptions.next_debit_date,
        last_debit_at: autopaySubscriptions.last_debit_at,
        created_at: autopaySubscriptions.created_at,
        has_qr: sql<boolean>`${autopaySubscriptions.qr_data} IS NOT NULL`,
        customer_name: customers.name,
        customer_mobile: customers.mobile,
        primary_stb: customers.stb_number,
        connection_stb: customerConnections.stb_number,
      })
      .from(autopaySubscriptions)
      .innerJoin(customers, eq(autopaySubscriptions.customer_id, customers.id))
      .leftJoin(customerConnections, eq(autopaySubscriptions.connection_id, customerConnections.id))
      .where(eq(autopaySubscriptions.operator_id, admin.operatorId))
      .orderBy(desc(autopaySubscriptions.created_at));

    return NextResponse.json({
      subscriptions: rows.map(({ primary_stb, connection_stb, ...r }) => ({ ...r, stb_number: connection_stb ?? primary_stb })),
    });
  } catch (error) {
    console.error('Get admin autopay error:', error);
    return NextResponse.json({ error: 'Failed to load AutoPay. Has the migration been run?' }, { status: 500 });
  }
}
