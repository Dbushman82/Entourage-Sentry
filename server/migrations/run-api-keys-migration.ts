import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  // Create a postgres connection
  const connectionString = process.env.DATABASE_URL || '';
  const client = postgres(connectionString);
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '04-add-api-keys.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running migration: 04-add-api-keys.sql');
    console.log('Executing SQL:');
    console.log(sql);

    // Execute the SQL
    await client.unsafe(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await client.end();
  }
}

runMigration();