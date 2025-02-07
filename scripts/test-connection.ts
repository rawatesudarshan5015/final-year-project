import { getDatabase } from '../src/lib/db';

async function testConnections() {
  try {
    const db = await getDatabase();

    // Test MySQL
    const [mysqlResult] = await db.mysql.query('SELECT 1 as test');
    console.log('MySQL Connection Test:', mysqlResult);

    // Test MongoDB
    const mongoResult = await db.mongo.logs.insertOne({
      test: true,
      timestamp: new Date()
    });
    console.log('MongoDB Connection Test:', mongoResult);

    console.log('All database connections are working!');
  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    process.exit();
  }
}

testConnections(); 