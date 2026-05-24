import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges } from '@/lib/db/schema';
import { eq, desc, or, ilike, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  stb_number: z.string().min(1, 'STB number is required'),
  area: z.string().min(1, 'Area is required'),
  pin: z.string().min(4, 'PIN must be at least 4 characters'),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Get all customers with recharge stats
    let query = db
      .select({
        customer: customers,
        rechargeCount: sql<number>`count(${recharges.id})::int`,
        lastRecharge: sql<string>`max(${recharges.plan_name})`,
      })
      .from(customers)
      .leftJoin(recharges, eq(customers.id, recharges.customer_id))
      .groupBy(customers.id)
      .orderBy(desc(customers.created_at))
      .$dynamic();

    // Search filter
    if (search) {
      query = query.where(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.mobile, `%${search}%`),
          ilike(customers.stb_number, `%${search}%`),
          ilike(customers.area, `%${search}%`)
        )
      );
    }

    const results = await query;

    return NextResponse.json({ customers: results });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

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

    const newCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    return NextResponse.json({ 
      success: true, 
      customer: newCustomer[0],
      message: 'Customer created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
