// Check orders and order items in the database
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { orders, orderItems, users } from '../dist/db/schema.js';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

// Read DATABASE_URL from .env
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  try {
    console.log('Fetching all users...');
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    }).from(users);
    
    console.log(`\nFound ${allUsers.length} users:`);
    allUsers.forEach(u => console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`));
    
    console.log('\n--- Checking Orders ---');
    const allOrders = await db.select().from(orders);
    console.log(`\nFound ${allOrders.length} total orders:`);
    
    for (const order of allOrders) {
      console.log(`\nOrder ID: ${order.id}`);
      console.log(`  Order Number: ${order.orderNumber}`);
      console.log(`  User ID: ${order.userId}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Total: ${order.total}`);
      console.log(`  Created: ${order.createdAt}`);
      
      // Get order items for this order
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      console.log(`  Items (${items.length}):`);
      items.forEach(item => {
        console.log(`    - Product ID: ${item.productId}, Name: ${item.productName}, Qty: ${item.quantity}`);
      });
    }
    
    // Check if there are any order items at all
    console.log('\n--- All Order Items ---');
    const allItems = await db.select().from(orderItems);
    console.log(`Total order items in database: ${allItems.length}`);
    allItems.forEach(item => {
      console.log(`  Order ID: ${item.orderId}, Product ID: ${item.productId}, Product: ${item.productName}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
