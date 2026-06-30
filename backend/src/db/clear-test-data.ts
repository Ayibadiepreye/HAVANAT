// Havanat — Clear All Test Data
// Run with: npm run db:clear:test
// Removes all data EXCEPT users, membership_tiers, and tier discounts
// Keeps the 6 mock user accounts intact for quick re-seeding

import 'dotenv/config';
import { db, client } from './client.js';
import { sql } from 'drizzle-orm';

async function clearAllTestData() {
  console.log('\n🧹 Clearing all test data...\n');
  console.log('Keeping: users, membership_tiers, and user tier assignments');
  console.log('Removing: products, orders, reviews, bespoke requests, delivery zones, etc.\n');

  try {
    // Clear all tables EXCEPT users and membership_tiers
    await db.execute(sql`
      TRUNCATE TABLE
        audit_log,
        bespoke_requests,
        reviews,
        returns,
        payouts,
        order_items,
        orders,
        rider_profiles,
        addresses,
        products,
        delivery_zones,
        notifications,
        newsletter_subscribers,
        email_templates,
        memberships,
        members,
        refresh_tokens
      RESTART IDENTITY CASCADE
    `);

    console.log('✅ Test data cleared successfully!\n');
    console.log('Preserved:');
    console.log('  ✓ All user accounts (admin, moderator, rider, customers)');
    console.log('  ✓ Membership tiers (Standard, Deluxe, Elite)');
    console.log('  ✓ User tier assignments\n');
    console.log('Removed:');
    console.log('  ✗ All products');
    console.log('  ✗ All orders and order items');
    console.log('  ✗ All reviews');
    console.log('  ✗ All returns');
    console.log('  ✗ All bespoke requests');
    console.log('  ✗ All delivery zones');
    console.log('  ✗ All notifications');
    console.log('  ✗ All memberships');
    console.log('  ✗ All audit logs');
    console.log('  ✗ All email templates');
    console.log('  ✗ Rider profiles');
    console.log('  ✗ All addresses\n');
    console.log('Ready for fresh test data. Run: npm run db:seed:test\n');

  } catch (err) {
    console.error('❌ Clear failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearAllTestData();
