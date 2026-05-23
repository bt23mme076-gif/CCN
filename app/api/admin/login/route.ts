import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find admin
    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, validatedData.username))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      admin[0].password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signToken({
      adminId: admin[0].id,
      username: admin[0].username,
      role: 'admin',
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin[0].id,
        username: admin[0].username,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
