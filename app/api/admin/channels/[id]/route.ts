import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateChannelSchema = z.object({
  price: z.number().int().nonnegative('Price must be non-negative').optional(),
  epg: z.number().int().positive('EPG must be positive').optional(),
  name: z.string().min(1).optional(),
  hd_sd: z.enum(['HD', 'SD']).optional(),
  genre: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();

    const body = await request.json();
    const { price, epg, name, hd_sd, genre, type } = updateChannelSchema.parse(body);
    const channelId = parseInt((await params).id);

    if (isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (price !== undefined) {
      updateData.price = price;
      updateData.mrp = Math.round(price / 1.18);
    }
    if (epg !== undefined) updateData.epg = epg;
    if (name !== undefined) updateData.name = name;
    if (hd_sd !== undefined) updateData.hd_sd = hd_sd;
    if (genre !== undefined) updateData.genre = genre;
    if (type !== undefined) updateData.type = type;

    await db
      .update(channels)
      .set(updateData)
      .where(and(eq(channels.id, channelId), eq(channels.operator_id, admin.operatorId)));

    const updatedChannel = await db
      .select()
      .from(channels)
      .where(and(eq(channels.id, channelId), eq(channels.operator_id, admin.operatorId)))
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();

    const channelId = parseInt((await params).id);

    if (isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const deleted = await db
      .delete(channels)
      .where(and(eq(channels.id, channelId), eq(channels.operator_id, admin.operatorId)))
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
