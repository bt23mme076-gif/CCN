import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCustomerConnections } from '@/lib/connections';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await getCustomerConnections(user.customerId);
  return NextResponse.json({ connections });
}
