import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create a postgres connection
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString);

// Create a drizzle instance using the postgres connection
export const db = drizzle(client, { schema });