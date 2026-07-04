import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import fs from 'fs';
import path from 'path';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Ensure any existing 0 rupee channels are deleted from DB
    await db.delete(channels).where(eq(channels.price, 0));

    // 2. Fetch channels from DB
    let dbChannels = await db
      .select()
      .from(channels)
      .orderBy(asc(channels.name));

    // 3. Auto-seed if empty
    if (dbChannels.length === 0) {
      console.log('Channels database is empty. Auto-seeding from channels-alacarte.json...');
      
      const jsonPath = path.join(process.cwd(), 'public', 'channels-alacarte.json');
      if (fs.existsSync(jsonPath)) {
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        const jsonChannels = JSON.parse(fileContent);

        if (Array.isArray(jsonChannels) && jsonChannels.length > 0) {
          // Remove all 0 rupee channels during seeding
          const filteredChannels = jsonChannels.filter((c: any) => c.price > 0);

          const insertData = filteredChannels.map((c: any) => ({
            id: c.id,
            name: c.name,
            hd_sd: c.hd_sd,
            genre: c.genre,
            epg: c.epg,
            type: c.type,
            mrp: Math.round(c.mrp * 100), // convert to paise
            price: Math.round(c.price * 100), // convert to paise
            is_active: true,
          }));

          // Insert in chunks of 100 to avoid query parameter limit in postgres
          const chunkSize = 100;
          for (let i = 0; i < insertData.length; i += chunkSize) {
            const chunk = insertData.slice(i, i + chunkSize);
            await db.insert(channels).values(chunk);
          }

          console.log(`Auto-seeded ${insertData.length} channels successfully.`);

          // Re-fetch
          dbChannels = await db
            .select()
            .from(channels)
            .orderBy(asc(channels.name));
        }
      }
    }

    return NextResponse.json(
      { channels: dbChannels },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (error) {
    console.error('Fetch channels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
