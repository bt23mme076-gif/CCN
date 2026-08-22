import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const rows = await db
      .select()
      .from(employees)
      .where(and(eq(employees.is_active, true), eq(employees.operator_id, admin.operatorId)))
      .orderBy(asc(employees.name));

    return NextResponse.json({ employees: rows });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(employees)
      .where(and(eq(employees.name, name.trim()), eq(employees.operator_id, admin.operatorId)));

    if (existing.length > 0 && existing[0].is_active) {
      return NextResponse.json({ employee: existing[0] });
    }

    const id = `emp_${randomBytes(8).toString('hex')}`;
    await db.insert(employees).values({ id, operator_id: admin.operatorId, name: name.trim() });

    return NextResponse.json({ success: true, employee: { id, name: name.trim(), is_active: true } });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
