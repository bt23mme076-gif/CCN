import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find customer
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.mobile, validatedData.mobile))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Invalid mobile number or PIN' },
        { status: 401 }
      );
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(
      validatedData.pin,
      customer[0].pin_hash
    );

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid mobile number or PIN' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signToken({
      customerId: customer[0].id,
      mobile: customer[0].mobile,
      role: 'customer',
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer[0].id,
        name: customer[0].name,
        mobile: customer[0].mobile,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
