import { getDatabase } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

interface MigrationResult extends RowDataPacket {
  migration_sql: string;
}

async function runMigrations() {
  const db = await getDatabase();
  const connection = await db.mysql.getConnection();

  try {
    // Run all migrations in order
    const migrations = [
      '02_add_interests.sql',
      '03_add_messaging.sql',
      '04_add_missing_columns.sql'
    ];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const migrationPath = path.join(process.cwd(), 'src', 'db', 'migrations', migration);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute each statement
      const statements = migrationSQL
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim());

      for (const stmt of statements) {
        if (!stmt) continue;

        try {
          const [result] = await connection.query<MigrationResult[]>(stmt);
          
          if (Array.isArray(result) && result[0] && result[0].migration_sql) {
            const sqlToExecute = result[0].migration_sql;
            if (sqlToExecute.startsWith('CREATE TABLE') || sqlToExecute.startsWith('ALTER TABLE')) {
              await connection.query(sqlToExecute);
              console.log('Executed:', sqlToExecute);
            } else {
              console.log('Skipped:', sqlToExecute);
            }
          }
        } catch (error) {
          console.error(`Error executing statement: ${stmt}`);
          throw error;
        }
      }
      
      console.log(`Migration ${migration} completed successfully`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Make sure @types/node is installed
runMigrations().catch(console.error); 