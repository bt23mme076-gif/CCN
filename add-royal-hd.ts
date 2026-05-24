import 'dotenv/config';
import { db } from './lib/db/index';
import { plans } from './lib/db/schema';
import { randomBytes } from 'crypto';

async function addRoyalHD() {
  console.log('Adding Royal HD pack...');

  try {
    const royalHDPlan = {
      id: `plan_${randomBytes(8).toString('hex')}`,
      name: 'Royal HD',
      price: 34900, // ₹349 in paise
      duration_days: 30,
      channels: ['All HD Channels', 'Premium HD Quality', 'Sports HD', 'Movies HD'],
      is_popular: false,
      is_active: true,
    };

    await db.insert(plans).values(royalHDPlan);
    
    console.log('✅ Royal HD pack added successfully!');
    console.log('Plan Details:');
    console.log(`  Name: ${royalHDPlan.name}`);
    console.log(`  Price: ₹${royalHDPlan.price / 100}`);
    console.log(`  Duration: ${royalHDPlan.duration_days} days`);
    console.log(`  Channels: ${royalHDPlan.channels.join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add Royal HD pack!');
    console.error(error);
    process.exit(1);
  }
}

addRoyalHD();
