import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateChannelSchema = z.object({
  price: z.number().int().nonnegative('Price must be non-negative').optional(), // in paise, inclusive of tax
  epg: z.number().int().positive('EPG must be positive').optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { price, epg } = updateChannelSchema.parse(body);
    const channelId = parseInt(params.id);

    if (isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (price !== undefined) {
      updateData.price = price;
      updateData.mrp = Math.round(price / 1.18);
    }
    if (epg !== undefined) {
      updateData.epg = epg;
    }

    await db
      .update(channels)
      .set(updateData)
      .where(eq(channels.id, channelId));


    const updatedChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (updatedChannel.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ channel: updatedChannel[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Update channel error:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const channelId = parseInt(params.id);

    if (isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const deleted = await db
      .delete(channels)
      .where(eq(channels.id, channelId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Channel deleted successfully', channel: deleted[0] });
  } catch (error) {
    console.error('Delete channel error:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
