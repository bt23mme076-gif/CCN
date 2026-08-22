import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessories } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAccessorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().int().positive('Price must be positive'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const admin = await requireAdminAuth();

    const allAccessories = await db.select().from(accessories).where(eq(accessories.operator_id, admin.operatorId)).orderBy(accessories.price);

    return NextResponse.json({ accessories: allAccessories });
  } catch (error) {
    console.error('Get admin accessories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();

    const body = await request.json();
    const validatedData = createAccessorySchema.parse(body);

    const accessoryId = `acc_${randomBytes(8).toString('hex')}`;

    await db.insert(accessories).values({
      id: accessoryId,
      operator_id: admin.operatorId,
      name: validatedData.name,
      price: validatedData.price,
      description: validatedData.description || '',
      is_active: true,
    });

    const newAccessory = await db
      .select()
      .from(accessories)
      .where(eq(accessories.id, accessoryId))
      .limit(1);

    return NextResponse.json({ accessory: newAccessory[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create accessory error:', error);
    return NextResponse.json(
      { error: 'Failed to create accessory' },
      { status: 500 }
    );
  }
}
