import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { username, password } = schema.parse(await request.json());

    const rows = await db.select().from(superAdmins).where(eq(superAdmins.username, username)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ superAdminId: rows[0].id, username: rows[0].username, role: 'super_admin' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('super_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    console.error('Super-admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
