import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// This script will create all the database tables based on the schema

async function runMigration() {
  console.log('Starting database migration...');
  
  try {
    const connectionString = process.env.DATABASE_URL || '';
    console.log('Connecting to database...');
    
    // Create a new postgres connection just for migrations
    const migrationClient = postgres(connectionString, { max: 1 });
    
    // Create a new drizzle instance using the postgres connection
    const db = drizzle(migrationClient, { schema });
    
    // Run the migration
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();