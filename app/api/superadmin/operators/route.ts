import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operators, admins, customers } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { generateOrderId } from '@/lib/utils';

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

  const rows = await db.select().from(operators).orderBy(operators.created_at);

  // Count customers per operator
  const counts = await db
    .select({ operator_id: customers.operator_id, count: count() })
    .from(customers)
    .groupBy(customers.operator_id);

  const countMap = Object.fromEntries(counts.map(r => [r.operator_id, r.count]));

  return NextResponse.json(rows.map(op => ({ ...op, customer_count: countMap[op.id] ?? 0 })));
}

const createSchema = z.object({
  name: z.string().min(1),
  business_name: z.string().min(1),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  commission_percent: z.number().int().min(0).max(50).default(10),
  admin_username: z.string().min(3),
  admin_password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = createSchema.parse(await request.json());

    // Check subdomain not taken
    const existing = await db.select().from(operators).where(eq(operators.subdomain, body.subdomain)).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });

    const operatorId = body.subdomain; // use subdomain as the ID slug
    const adminId = generateOrderId();
    const passwordHash = await bcrypt.hash(body.admin_password, 10);

    await db.insert(operators).values({
      id: operatorId,
      name: body.name,
      business_name: body.business_name,
      subdomain: body.subdomain,
      commission_percent: body.commission_percent,
      kyc_status: 'pending',
      status: 'active',
    });

    await db.insert(admins).values({
      id: adminId,
      operator_id: operatorId,
      username: body.admin_username,
      password_hash: passwordHash,
    });

    return NextResponse.json({ success: true, operatorId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Create operator error:', error);
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 });
  }
}
