import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { desc, gte, lte, and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month'); // format: "2026-07"

    const conditions: ReturnType<typeof eq>[] = [eq(expenses.operator_id, admin.operatorId)];
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      conditions.push(gte(expenses.date, start), lte(expenses.date, end));
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));

    const total = rows.reduce((s, r) => s + r.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
    }

    return NextResponse.json({ expenses: rows, total, byCategory });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { title, amount, category, note, date, employee_id } = await request.json();

    if (!title || !amount || !category || !date) {
      return NextResponse.json({ error: 'title, amount, category, date required' }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const id = `exp_${randomBytes(8).toString('hex')}`;
    await db.insert(expenses).values({
      id,
      operator_id: admin.operatorId,
      title,
      amount: Math.round(amount),
      category,
      employee_id: employee_id || null,
      note: note?.trim() || null,
      date: new Date(date),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
