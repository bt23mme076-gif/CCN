import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { streamAdPackages, streamAdBookings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { requireOperator } from '@/lib/db/tenant';
import { buildUpiLink } from '@/lib/payments/upi';
import { buildPayuTxnParams, isPayuEnabled } from '@/lib/payments/payu';

export const dynamic = 'force-dynamic';

// ~2 MB image once base64-encoded (4/3 overhead) plus the data-URL prefix.
const MAX_BANNER_CHARS = Math.ceil(2.9 * 1024 * 1024);

const schema = z.object({
  packageId: z.string().min(1),
  advertiserName: z.string().trim().min(2, 'Please enter your name').max(80),
  businessName: z.string().trim().max(120).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  bannerData: z
    .string()
    .startsWith('data:image/', 'Please upload an image file')
    .max(MAX_BANNER_CHARS, 'Banner image must be under 2 MB'),
  scrollText: z.string().trim().max(300).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please pick a start date'),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const operator = await requireOperator();
    const input = schema.parse(await request.json());

    const [pkg] = await db
      .select()
      .from(streamAdPackages)
      .where(and(eq(streamAdPackages.id, input.packageId), eq(streamAdPackages.operator_id, operator.id)))
      .limit(1);
    if (!pkg || !pkg.is_active) {
      return NextResponse.json({ error: 'This ad package is no longer available' }, { status: 404 });
    }

    // Dates are calendar days in IST.
    const start = new Date(`${input.startDate}T00:00:00+05:30`);
    const todayIst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (input.startDate < todayIst) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }
    const end = new Date(start.getTime() + (pkg.duration_days - 1) * 86400000);

    const orderId = generateOrderId();
    await db.insert(streamAdBookings).values({
      id: orderId,
      operator_id: operator.id,
      package_id: pkg.id,
      ad_type: pkg.ad_type,
      package_name: pkg.name,
      duration_days: pkg.duration_days,
      amount: pkg.price,
      advertiser_name: input.advertiserName,
      business_name: input.businessName || null,
      phone: input.phone,
      banner_data: input.bannerData,
      scroll_text: input.scrollText || null,
      start_date: start,
      end_date: end,
      notes: input.notes || null,
      status: 'pending',
    });

    const upiLink = buildUpiLink(pkg.price, `Ad - ${input.advertiserName} - ${pkg.name}`);

    const origin = request.nextUrl.origin;
    const payu = await isPayuEnabled()
      ? buildPayuTxnParams({
          txnid: orderId,
          amountPaise: pkg.price,
          productinfo: `Live Ad - ${pkg.name}`,
          firstname: input.advertiserName,
          email: `${input.phone}@ccn.atyant.in`,
          phone: input.phone,
          udf1: 'stream_ad',
          surl: `${origin}/api/payu/callback`,
          furl: `${origin}/api/payu/callback`,
        })
      : null;

    return NextResponse.json({ orderId, upiLink, amount: pkg.price, payu });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create stream ad order error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
