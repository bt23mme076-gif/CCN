import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdminAuth();
  const conns = await db.select().from(customerConnections)
    .where(eq(customerConnections.customer_id, params.id));
  return NextResponse.json({ connections: conns });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdminAuth();
  const { stb_number, area, label } = await request.json();
  if (!stb_number?.trim()) {
    return NextResponse.json({ error: 'STB number required' }, { status: 400 });
  }
  const id = randomBytes(8).toString('hex');
  await db.insert(customerConnections).values({
    id,
    customer_id: params.id,
    stb_number: stb_number.trim(),
    area: area?.trim() || '',
    label: label?.trim() || null,
  });
  return NextResponse.json({ id });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdminAuth();
  const { connectionId } = await request.json();
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
  await db.delete(customerConnections)
    .where(and(eq(customerConnections.id, connectionId), eq(customerConnections.customer_id, params.id)));
  return NextResponse.json({ success: true });
}
