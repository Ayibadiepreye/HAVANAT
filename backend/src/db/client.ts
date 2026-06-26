import { drizzle } from 'drizzle-orm/node-postgres';
// `pg` is a CommonJS module that exports via `module.exports = ...`.
// TypeScript's `@types/pg` doesn't include a default export, so we use
// `import * as` with a cast (or the createRequire pattern).
import * as pgNs from 'pg';
const Pool = (pgNs as unknown as { Pool: typeof import('pg').Pool }).Pool;
import { config } from '../config.js';
import * as schema from './schema.js';

export const pool = new Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });

export const client = pool;
export type DB = typeof db;