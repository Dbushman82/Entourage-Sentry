/**
 * Migration script to expand company address fields
 * 
 * This script will add detailed address fields to the companies table
 * Run with: npx tsx server/migrations/run-address-migration.ts
 */

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Create a connection to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  console.log('Connected to database');

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '05-expand-company-address.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration to expand company address fields...');
    await pool.query(migrationSql);
    
    console.log('Migration completed successfully!');
    console.log('Added fields: street_address, city, state, postal_code, country');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);