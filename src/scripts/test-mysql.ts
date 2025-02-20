import { mysqlPool } from '../lib/db/mysql';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testMySQLConnection() {
  try {
    console.log('MySQL Environment Variables:');
    console.log('Host:', process.env.MYSQL_HOST);
    console.log('User:', process.env.MYSQL_USER);
    console.log('Database:', process.env.MYSQL_DATABASE);

    const connection = await mysqlPool.getConnection();
    console.log('MySQL Connection successful');
    
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Query result:', result);
    
    connection.release();
  } catch (error) {
    console.error('MySQL Connection test failed:', error);
  } finally {
    process.exit();
  }
}

testMySQLConnection(); 