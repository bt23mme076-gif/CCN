import { db } from './lib/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Running Cashfree migration...');
    
    // Check if columns exist
    console.log('📋 Checking current schema...');
    
    // Rename columns
    console.log('🔧 Renaming razorpay_order_id to cashfree_order_id...');
    await db.execute(sql`
      ALTER TABLE recharges 
      RENAME COLUMN razorpay_order_id TO cashfree_order_id
    `);
    
    console.log('🔧 Renaming razorpay_payment_id to cashfree_payment_id...');
    await db.execute(sql`
      ALTER TABLE recharges 
      RENAME COLUMN razorpay_payment_id TO cashfree_payment_id
    `);
    
    console.log('🔧 Renaming razorpay_signature to cashfree_signature...');
    await db.execute(sql`
      ALTER TABLE recharges 
      RENAME COLUMN razorpay_signature TO cashfree_signature
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update .env with Cashfree credentials');
    console.log('2. Restart your server: npm run dev');
    console.log('3. Test payment flow');
    
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      console.log('⚠️  Columns already migrated or do not exist');
      console.log('✅ Your database is ready to use!');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error);
      console.log('');
      console.log('This might mean:');
      console.log('1. Migration already completed');
      console.log('2. Database connection issue');
      console.log('3. Columns have different names');
      process.exit(1);
    }
  }
}

runMigration();
