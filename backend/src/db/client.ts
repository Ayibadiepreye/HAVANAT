import { drizzle } from 'drizzle-orm/node-postgres';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// pg is a CJS module — load via require so TypeScript correctly threads the types
const { Pool } = require('pg') as typeof import('pg');
import { config } from '../config.js';
import * as schema from './schema.js';

export const pool = new Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });

export const client = pool;
export type DB = typeof db;