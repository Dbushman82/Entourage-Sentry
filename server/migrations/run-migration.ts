import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a specific migration file
async function runMigrationFile(filename: string) {
  console.log(`Running migration: ${filename}`);
  const filePath = path.join(__dirname, filename);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing SQL:\n${sql}`);
    
    // Execute the SQL directly
    await db.execute(sql);
    
    console.log(`Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${filename}:`, error);
    throw error;
  }
}

// Main function to run migrations
async function runMigrations() {
  try {
    // Run the assessment ID migration
    await runMigrationFile('03-add-assessment-id-to-responses.sql');
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();