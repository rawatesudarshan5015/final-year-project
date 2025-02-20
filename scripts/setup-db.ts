import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupMySQLDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  try {
    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
    );

    // Use the database
    await connection.query(`USE ${process.env.MYSQL_DATABASE}`);

    // Create students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ern_number VARCHAR(10) UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        branch VARCHAR(50),
        batch_year INTEGER,
        section VARCHAR(5),
        mobile_number VARCHAR(15),
        password VARCHAR(255),
        first_login BOOLEAN DEFAULT TRUE,
        interests JSON DEFAULT NULL,
        profile_pic_url VARCHAR(255) DEFAULT NULL,
        cloudinary_public_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_ern (ern_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('MySQL setup completed successfully');
  } catch (error) {
    console.error('Error setting up MySQL:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function setupMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    // Create collections
    await db.createCollection('logs');
    await db.createCollection('upload_logs');
    await db.createCollection('email_logs');
    await db.createCollection('interests');

    // Create indexes
    await Promise.all([
      db.collection('upload_logs').createIndex({ startTime: -1 }),
      db.collection('upload_logs').createIndex({ "errors.ern_number": 1 }),
      db.collection('email_logs').createIndex({ timestamp: -1 }),
      db.collection('email_logs').createIndex({ studentEmail: 1 }),
      db.collection('email_logs').createIndex({ status: 1 })
    ]);

    // Insert interests data if collection is empty
    const interestsCount = await db.collection('interests').countDocuments();
    if (interestsCount === 0) {
      await db.collection('interests').insertMany([
        {
          category: 'sports',
          options: [
            'Cricket',
            'Football',
            'Basketball',
            'Volleyball',
            'Badminton',
            'Table Tennis',
            'Chess',
            'Kabaddi'
          ]
        },
        {
          category: 'hobbies',
          options: [
            'Reading',
            'Gaming',
            'Music',
            'Dancing',
            'Photography',
            'Painting',
            'Writing',
            'Cooking',
            'Trekking'
          ]
        },
        {
          category: 'domain',
          options: [
            'Web Development',
            'Mobile Apps',
            'Cybersecurity',
            'Cloud Computing',
            'Data Science',
            'Blockchain',
            'IoT',
            'Machine Learning',
            'Artificial Intelligence',
            'Data Analysis',
            'Data Engineering',
            'DevOps'
          ]
        }
      ]);
    }

    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    await setupMySQLDatabase();
    await setupMongoDB();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

main(); 