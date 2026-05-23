import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  stb_number: z.string().min(1, 'STB number is required'),
  area: z.string().min(1, 'Area is required'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if mobile already exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.mobile, validatedData.mobile))
      .limit(1);

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { error: 'Mobile number already registered' },
        { status: 400 }
      );
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(validatedData.pin, 10);

    // Create customer
    const customerId = `cust_${randomBytes(8).toString('hex')}`;
    await db.insert(customers).values({
      id: customerId,
      name: validatedData.name,
      mobile: validatedData.mobile,
      stb_number: validatedData.stb_number,
      area: validatedData.area,
      pin_hash: pinHash,
    });

    // Generate JWT
    const token = signToken({
      customerId,
      mobile: validatedData.mobile,
      role: 'customer',
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      customer: {
        id: customerId,
        name: validatedData.name,
        mobile: validatedData.mobile,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
