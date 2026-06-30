// Low Stock Alert Job
//
// Periodically checks for products with low stock and notifies admins.
// Runs every 24 hours to avoid spam.

import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { products, notifications, users } from '../db/schema.js';
import { lte, eq } from 'drizzle-orm';

export const DEFAULT_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LowStockResult {
  checked: number;
  lowStock: number;
  outOfStock: number;
  notificationsSent: number;
  durationMs: number;
}

export async function checkLowStock(): Promise<LowStockResult> {
  const start = Date.now();
  
  // Get all products
  const allProducts = await db.select().from(products);
  
  const lowStockProducts: Array<{ id: number; name: string; stock: number; threshold: number }> = [];
  const outOfStockProducts: Array<{ id: number; name: string }> = [];
  
  for (const product of allProducts) {
    const stock = product.stock ?? 0;
    const threshold = product.lowStockThreshold ?? 5;
    
    if (stock === 0) {
      outOfStockProducts.push({ id: product.id, name: product.name });
    } else if (stock <= threshold) {
      lowStockProducts.push({ id: product.id, name: product.name, stock, threshold });
    }
  }
  
  // Get all admins
  const admins = await db.select().from(users).where(eq(users.role, 'admin'));
  
  let notificationsSent = 0;
  
  // Create notifications for admins
  if (lowStockProducts.length > 0 || outOfStockProducts.length > 0) {
    for (const admin of admins) {
      // Low stock notification
      if (lowStockProducts.length > 0) {
        await db.insert(notifications).values({
          category: 'system',
          title: `⚠️ ${lowStockProducts.length} Low Stock Alert${lowStockProducts.length > 1 ? 's' : ''}`,
          body: `The following products are running low: ${lowStockProducts.slice(0, 5).map(p => `${p.name} (${p.stock} left)`).join(', ')}${lowStockProducts.length > 5 ? ` and ${lowStockProducts.length - 5} more` : ''}`,
          targetUserId: admin.id,
          scope: 'user',
        });
        notificationsSent++;
      }
      
      // Out of stock notification
      if (outOfStockProducts.length > 0) {
        await db.insert(notifications).values({
          category: 'system',
          title: `🚫 ${outOfStockProducts.length} Out of Stock Alert${outOfStockProducts.length > 1 ? 's' : ''}`,
          body: `The following products are OUT OF STOCK: ${outOfStockProducts.slice(0, 5).map(p => p.name).join(', ')}${outOfStockProducts.length > 5 ? ` and ${outOfStockProducts.length - 5} more` : ''}`,
          targetUserId: admin.id,
          scope: 'user',
        });
        notificationsSent++;
      }
    }
  }
  
  return {
    checked: allProducts.length,
    lowStock: lowStockProducts.length,
    outOfStock: outOfStockProducts.length,
    notificationsSent,
    durationMs: Date.now() - start,
  };
}

let alertInterval: NodeJS.Timeout | null = null;

/** Boot-time setup. Idempotent — calling twice is a no-op. */
export function startLowStockAlerts(opts?: { intervalMs?: number }): void {
  if (alertInterval) return;
  const intervalMs = opts?.intervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
  
  // Run once at startup
  checkLowStock()
    .then((r) => {
      if (r.lowStock > 0 || r.outOfStock > 0) {
        console.log(`[stock-alert] startup: ${r.lowStock} low stock, ${r.outOfStock} out of stock, ${r.notificationsSent} notifications sent`);
      }
    })
    .catch((err) => console.error('[stock-alert] startup failed', err));
  
  alertInterval = setInterval(() => {
    checkLowStock()
      .then((r) => {
        if (r.lowStock > 0 || r.outOfStock > 0) {
          console.log(`[stock-alert] interval: ${r.lowStock} low stock, ${r.outOfStock} out of stock, ${r.notificationsSent} notifications sent`);
        }
      })
      .catch((err) => console.error('[stock-alert] interval failed', err));
  }, intervalMs);
  
  if (typeof alertInterval.unref === 'function') alertInterval.unref();
}

export function stopLowStockAlerts(): void {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}
