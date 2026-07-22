import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getConnectionGroup } from '@/lib/connections';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupIds = await getConnectionGroup(user.customerId);

    const connections = await db
      .select({
        id: customers.id,
        name: customers.name,
        stb_number: customers.stb_number,
        area: customers.area,
        primary_customer_id: customers.primary_customer_id,
      })
      .from(customers)
      .where(inArray(customers.id, groupIds));

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}
