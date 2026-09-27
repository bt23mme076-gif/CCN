import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  operators, admins, customers, plans, recharges, announcements,
  accessories, advertisements, channels, accessoryOrders,
  settlements, refunds, employees, expenses,
} from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  business_name: z.string().min(1).optional(),
  commission_percent: z.number().int().min(0).max(50).optional(),
  kyc_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = updateSchema.parse(await request.json());
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await db.update(operators).set(body).where(eq(operators.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update operator error:', error);
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [{ value: customerCount }] = await db
    .select({ value: count() })
    .from(customers)
    .where(eq(customers.operator_id, id));

  if (customerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this operator still has ${customerCount} customer(s). Remove them first.` },
      { status: 409 }
    );
  }

  try {
    // Every table that references operators.id has to be cleared first —
    // Postgres blocks the operator delete otherwise (FK constraint), and
    // child-of-child rows (e.g. accessory_orders -> accessories,
    // expenses -> employees, refunds -> recharges) have to go before their
    // parent for the same reason.
    await db.transaction(async (tx) => {
      await tx.delete(refunds).where(eq(refunds.operator_id, id));
      await tx.delete(settlements).where(eq(settlements.operator_id, id));
      await tx.delete(accessoryOrders).where(eq(accessoryOrders.operator_id, id));
      // customerPriceOverrides/customerPlanDiscounts/retrackRequests/
      // pushSubscriptions all cascade automatically (onDelete: 'cascade' on
      // their customer_id/plan_id FKs) once customers/plans below are gone.
      await tx.delete(recharges).where(eq(recharges.operator_id, id));
      await tx.delete(plans).where(eq(plans.operator_id, id));
      await tx.delete(announcements).where(eq(announcements.operator_id, id));
      await tx.delete(accessories).where(eq(accessories.operator_id, id));
      await tx.delete(advertisements).where(eq(advertisements.operator_id, id));
      await tx.delete(channels).where(eq(channels.operator_id, id));
      await tx.delete(expenses).where(eq(expenses.operator_id, id));
      await tx.delete(employees).where(eq(employees.operator_id, id));
      await tx.delete(admins).where(eq(admins.operator_id, id));
      await tx.delete(customers).where(eq(customers.operator_id, id));
      await tx.delete(operators).where(eq(operators.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete operator error:', error);
    return NextResponse.json({ error: `Failed to delete: ${(error as Error).message}` }, { status: 500 });
  }
}
