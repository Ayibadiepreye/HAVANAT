import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config.js';
import * as schema from './schema.js';

export const pool = new Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });

export const client = pool;
export type DB = typeof db;
