// Check reviews in the database
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { reviews } from '../dist/db/schema.js';

const { Pool } = pg;

// Read DATABASE_URL from .env
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  try {
    console.log('Fetching all reviews...\n');
    const allReviews = await db.select().from(reviews);
    
    console.log(`Found ${allReviews.length} total reviews:\n`);
    
    allReviews.forEach(r => {
      console.log(`Review ID: ${r.id}`);
      console.log(`  Product ID: ${r.productId}`);
      console.log(`  User ID: ${r.userId}`);
      console.log(`  User Name: ${r.userName}`);
      console.log(`  Rating: ${r.rating} stars`);
      console.log(`  Review: "${r.reviewText}"`);
      console.log(`  Approved: ${r.approved}`);
      console.log(`  Created: ${r.createdAt}`);
      console.log(`  Updated: ${r.updatedAt}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
