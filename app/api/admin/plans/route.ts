import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().int().positive('Price must be positive'),
  duration_days: z.number().int().positive('Duration must be positive'),
  channels: z.array(z.string()),
  is_popular: z.boolean().default(false),
});

export async function GET() {
  try {
    const admin = await requireAdminAuth();

    const allPlans = await db.select().from(plans).where(eq(plans.operator_id, admin.operatorId)).orderBy(plans.price);

    return NextResponse.json({ plans: allPlans });
  } catch (error) {
    console.error('Get admin plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();

    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    const planId = `plan_${randomBytes(8).toString('hex')}`;

    await db.insert(plans).values({
      id: planId,
      operator_id: admin.operatorId,
      name: validatedData.name,
      price: validatedData.price,
      duration_days: validatedData.duration_days,
      channels: validatedData.channels,
      is_popular: validatedData.is_popular,
      is_active: true,
    });

    const newPlan = await db
      .select()
      .from(plans)
      .where(sql`${plans.id} = ${planId}`)
      .limit(1);

    return NextResponse.json({ plan: newPlan[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create plan error:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
