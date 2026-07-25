import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessories, accessoryOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAccessorySchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const validatedData = updateAccessorySchema.parse(body);
    const accessoryId = params.id;

    await db
      .update(accessories)
      .set(validatedData)
      .where(eq(accessories.id, accessoryId));

    const updatedAccessory = await db
      .select()
      .from(accessories)
      .where(eq(accessories.id, accessoryId))
      .limit(1);

    if (updatedAccessory.length === 0) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }

    return NextResponse.json({ accessory: updatedAccessory[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Update accessory error:', error);
    return NextResponse.json(
      { error: 'Failed to update accessory' },
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

    const accessoryId = params.id;

    // Check if accessory exists
    const existingAccessory = await db
      .select()
      .from(accessories)
      .where(eq(accessories.id, accessoryId))
      .limit(1);

    if (existingAccessory.length === 0) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }

    // Check if there are any orders using this accessory
    const ordersUsingAccessory = await db
      .select()
      .from(accessoryOrders)
      .where(eq(accessoryOrders.accessory_id, accessoryId))
      .limit(1);

    if (ordersUsingAccessory.length > 0) {
      // Instead of deleting, just hide the accessory
      await db
        .update(accessories)
        .set({ is_active: false })
        .where(eq(accessories.id, accessoryId));

      return NextResponse.json({ 
        success: true, 
        message: 'Accessory has existing orders. Accessory has been hidden instead of deleted.' 
      });
    }

    // No orders, safe to delete
    await db.delete(accessories).where(eq(accessories.id, accessoryId));

    return NextResponse.json({ success: true, message: 'Accessory deleted successfully' });
  } catch (error) {
    console.error('Delete accessory error:', error);
    return NextResponse.json(
      { error: 'Failed to delete accessory' },
      { status: 500 }
    );
  }
}
