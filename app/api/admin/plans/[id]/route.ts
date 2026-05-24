import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  duration_days: z.number().int().positive().optional(),
  channels: z.array(z.string()).optional(),
  is_popular: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const validatedData = updatePlanSchema.parse(body);
    const planId = params.id;

    await db
      .update(plans)
      .set(validatedData)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const planId = params.id;

    // Check if plan exists
    const existingPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if there are any recharges using this plan
    const rechargesUsingPlan = await db
      .select()
      .from(recharges)
      .where(eq(recharges.plan_id, planId))
      .limit(1);

    if (rechargesUsingPlan.length > 0) {
      // Instead of deleting, just hide the plan
      await db
        .update(plans)
        .set({ is_active: false })
        .where(eq(plans.id, planId));

      return NextResponse.json({ 
        success: true, 
        message: 'Plan has existing recharges. Plan has been hidden instead of deleted.' 
      });
    }

    // No recharges, safe to delete
    await db.delete(plans).where(eq(plans.id, planId));

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
