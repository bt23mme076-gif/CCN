import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findCustomerByStbOrMobile } from '@/lib/guestLookup';

export const dynamic = 'force-dynamic';

const lookupSchema = z.object({
  identifier: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = lookupSchema.parse(body);

    const match = await findCustomerByStbOrMobile(identifier);
    if (!match) {
      return NextResponse.json({ error: 'Invalid STB or mobile number. Please check and try again.' }, { status: 404 });
    }

    return NextResponse.json({
      name: match.name,
      area: match.area,
      hasOutstandingBalance: match.outstanding_balance > 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'STB or mobile number required' }, { status: 400 });
    }
    console.error('Guest lookup error:', error);
    return NextResponse.json({ error: 'Failed to look up number' }, { status: 500 });
  }
}
