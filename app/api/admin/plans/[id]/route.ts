import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePlanSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { is_active } = updatePlanSchema.parse(body);
    const planId = params.id;

    await db
      .update(plans)
      .set({ is_active })
      .where(eq(plans.id, planId));

    const updatedPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (updatedPlan.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan: updatedPlan[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Update plan error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}
