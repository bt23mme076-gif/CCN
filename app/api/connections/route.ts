import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { getCustomerConnections } from '@/lib/connections';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await getCustomerConnections(user.customerId);

  // Fetch latest activated recharge for each connection to get plan status
  const withStatus = await Promise.all(
    connections.map(async (conn) => {
      const condition = conn.isPrimary
        ? and(eq(recharges.customer_id, user.customerId), isNull(recharges.connection_id))
        : and(eq(recharges.customer_id, user.customerId), eq(recharges.connection_id, conn.id));

      const latest = await db
        .select({ status: recharges.status, expires_at: recharges.expires_at })
        .from(recharges)
        .where(and(condition, eq(recharges.status, 'activated')))
        .orderBy(desc(recharges.expires_at))
        .limit(1);

      const isActive = latest.length > 0 &&
        latest[0].expires_at != null &&
        new Date(latest[0].expires_at) > new Date();

      return { ...conn, isActive };
    })
  );

  return NextResponse.json({ connections: withStatus });
}
