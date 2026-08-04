import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findCustomerByStb } from '@/lib/guestLookup';

export const dynamic = 'force-dynamic';

const lookupSchema = z.object({
  stb_number: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stb_number } = lookupSchema.parse(body);

    const match = await findCustomerByStb(stb_number);
    if (!match) {
      return NextResponse.json({ error: 'STB number not found. Please check and try again.' }, { status: 404 });
    }

    return NextResponse.json({
      name: match.name,
      area: match.area,
      hasOutstandingBalance: match.outstanding_balance > 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'STB number required' }, { status: 400 });
    }
    console.error('Guest STB lookup error:', error);
    return NextResponse.json({ error: 'Failed to look up STB number' }, { status: 500 });
  }
}
