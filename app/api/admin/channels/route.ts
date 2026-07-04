import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const createChannelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hd_sd: z.enum(['HD', 'SD']),
  genre: z.string().min(1, 'Genre is required'),
  epg: z.number().int().positive('Channel number must be positive'),
  type: z.string().min(1, 'Type is required'),
  price: z.number().nonnegative('Price must be non-negative'), // in Rupees (float allowed)
});

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const parsed = createChannelSchema.parse(body);

    // 1. Calculate max ID + 1
    const maxChannel = await db
      .select({ id: channels.id })
      .from(channels)
      .orderBy(desc(channels.id))
      .limit(1);
    
    const nextId = maxChannel.length > 0 ? maxChannel[0].id + 1 : 1;

    // 2. Convert price to paise (tax inclusive) and calculate MRP (price / 1.18)
    const pricePaise = Math.round(parsed.price * 100);
    const mrpPaise = Math.round(pricePaise / 1.18);

    // 3. Insert channel
    const newChannel = await db
      .insert(channels)
      .values({
        id: nextId,
        name: parsed.name,
        hd_sd: parsed.hd_sd,
        genre: parsed.genre,
        epg: parsed.epg,
        type: parsed.type,
        price: pricePaise,
        mrp: mrpPaise,
        is_active: true,
      })
      .returning();

    return NextResponse.json({ channel: newChannel[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create channel error:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
