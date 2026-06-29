// Auto-approve all existing reviews in the database
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { reviews } from '../dist/db/schema.js';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

// Read DATABASE_URL from .env
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  try {
    console.log('Fetching all reviews...');
    const allReviews = await db.select().from(reviews);
    
    console.log(`\nFound ${allReviews.length} total reviews`);
    
    const unapprovedReviews = allReviews.filter(r => !r.approved);
    console.log(`Unapproved reviews: ${unapprovedReviews.length}`);
    
    if (unapprovedReviews.length === 0) {
      console.log('\n✅ All reviews are already approved!');
      await pool.end();
      return;
    }
    
    console.log('\n📝 Unapproved reviews:');
    unapprovedReviews.forEach(r => {
      console.log(`  - Review ID ${r.id}: ${r.userName} rated product ${r.productId} with ${r.rating} stars`);
      const preview = r.reviewText.substring(0, 60) + (r.reviewText.length > 60 ? '...' : '');
      console.log(`    "${preview}"`);
    });
    
    console.log('\n🔄 Auto-approving all unapproved reviews...');
    
    for (const review of unapprovedReviews) {
      await db
        .update(reviews)
        .set({
          approved: true,
          approvedBy: review.userId, // Set as self-approved
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(reviews.id, review.id));
      
      console.log(`  ✅ Approved review ${review.id}`);
    }
    
    console.log(`\n✅ Successfully approved ${unapprovedReviews.length} reviews!`);
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await pool.end();
  }
}

main();
