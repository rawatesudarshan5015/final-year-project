import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function addProfileColumns() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    // Check if columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME IN ('profile_pic_url', 'cloudinary_public_id', 'interests')
    `, [process.env.MYSQL_DATABASE]);

    const existingColumns = new Set((columns as any[]).map(col => col.COLUMN_NAME));

    // Add missing columns
    const alterQueries = [];

    if (!existingColumns.has('profile_pic_url')) {
      alterQueries.push('ADD COLUMN profile_pic_url VARCHAR(255) DEFAULT NULL');
    }

    if (!existingColumns.has('cloudinary_public_id')) {
      alterQueries.push('ADD COLUMN cloudinary_public_id VARCHAR(255) DEFAULT NULL');
    }

    if (!existingColumns.has('interests')) {
      alterQueries.push('ADD COLUMN interests JSON DEFAULT NULL');
    }

    if (alterQueries.length > 0) {
      const alterQuery = `ALTER TABLE students ${alterQueries.join(', ')}`;
      await connection.execute(alterQuery);
      console.log('Added missing columns successfully');
    } else {
      console.log('All required columns already exist');
    }

  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addProfileColumns().catch(console.error); 