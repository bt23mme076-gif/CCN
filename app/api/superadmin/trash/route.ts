import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, recharges, operators } from '@/lib/db/schema';
import { isNotNull, eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

export async function GET() {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [deletedCustomers, deletedRecharges] = await Promise.all([
    db
      .select({ customer: customers, operatorName: operators.name })
      .from(customers)
      .leftJoin(operators, eq(customers.operator_id, operators.id))
      .where(isNotNull(customers.deleted_at))
      .orderBy(desc(customers.deleted_at)),
    db
      .select({ recharge: recharges, customer: customers, operatorName: operators.name })
      .from(recharges)
      .leftJoin(customers, eq(recharges.customer_id, customers.id))
      .leftJoin(operators, eq(recharges.operator_id, operators.id))
      .where(isNotNull(recharges.deleted_at))
      .orderBy(desc(recharges.deleted_at)),
  ]);

  return NextResponse.json({ customers: deletedCustomers, recharges: deletedRecharges });
}
