import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface CustomerJWTPayload {
  customerId: string;
  mobile: string;
  role: 'customer';
}

export interface AdminJWTPayload {
  adminId: string;
  username: string;
  role: 'admin';
}

export type JWTPayload = CustomerJWTPayload | AdminJWTPayload;

export function signToken(payload: JWTPayload): string {
  console.log('Signing token with payload:', payload);
  console.log('JWT_SECRET exists:', !!JWT_SECRET);
  console.log('JWT_SECRET length:', JWT_SECRET?.length);
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  console.log('Token created successfully');
  return token;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log('Verifying token...');
    console.log('JWT_SECRET exists:', !!JWT_SECRET);
    console.log('JWT_SECRET length:', JWT_SECRET?.length);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  return token?.value || null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

export async function requireCustomerAuth(): Promise<CustomerJWTPayload> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'customer') {
    throw new Error('Unauthorized');
  }
  return user as CustomerJWTPayload;
}

export async function requireAdminAuth(): Promise<AdminJWTPayload> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user as AdminJWTPayload;
}
