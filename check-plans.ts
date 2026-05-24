import 'dotenv/config';
import { db } from './lib/db';
import { plans } from './lib/db/schema';

async function checkPlans() {
  console.log('Checking all plans in database...\n');

  try {
    const allPlans = await db.select().from(plans);

    console.log(`Total plans in database: ${allPlans.length}\n`);

    allPlans.forEach((plan, index) => {
      console.log(`Plan ${index + 1}:`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Name: ${plan.name}`);
      console.log(`  Price: ₹${plan.price / 100}`);
      console.log(`  Duration: ${plan.duration_days} days`);
      console.log(`  Is Active: ${plan.is_active ? '✅ YES' : '❌ NO (HIDDEN)'}`);
      console.log(`  Is Popular: ${plan.is_popular}`);
      console.log('---');
    });

    // Check specifically for "Qwett" plan
    const qwettPlan = allPlans.find(p => p.name.toLowerCase().includes('qwett'));
    if (qwettPlan) {
      console.log('\n⚠️  Found "Qwett" plan:');
      console.log(`  ID: ${qwettPlan.id}`);
      console.log(`  Is Active: ${qwettPlan.is_active}`);
      console.log(`  Status: ${qwettPlan.is_active ? 'VISIBLE to customers' : 'HIDDEN from customers'}`);
    } else {
      console.log('\n✅ "Qwett" plan not found in database (successfully deleted)');
    }
  } catch (error) {
    console.error('❌ Failed to check plans:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkPlans();
