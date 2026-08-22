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
  operatorId: string;
}

export interface SuperAdminJWTPayload {
  superAdminId: string;
  username: string;
  role: 'super_admin';
}

export type JWTPayload = CustomerJWTPayload | AdminJWTPayload | SuperAdminJWTPayload;

export function signToken(payload: JWTPayload): string {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return token;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
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

export async function requireSuperAdminAuth(): Promise<SuperAdminJWTPayload> {
  const token = await getAuthToken();
  if (!token) throw new Error('Unauthorized');
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'super_admin') throw new Error('Unauthorized');
  return decoded as SuperAdminJWTPayload;
}
