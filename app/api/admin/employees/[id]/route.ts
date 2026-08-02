import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    await db
      .update(employees)
      .set({ is_active: false })
      .where(eq(employees.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
