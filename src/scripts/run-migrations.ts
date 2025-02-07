import { getDatabase } from '@/lib/db';
import * as path from 'path';
import * as fs from 'fs';

async function runMigrations() {
  const db = await getDatabase();
  const connection = await db.mysql.getConnection();

  try {
    // Read and execute the migration file
    const migrationPath = path.join(process.cwd(), 'src', 'db', 'migrations', '04_add_missing_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Use execute instead of query
    await connection.execute(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Make sure @types/node is installed
runMigrations().catch(console.error); 