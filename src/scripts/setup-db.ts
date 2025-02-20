import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

async function setupMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const dbName = process.env.MONGODB_DB;
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);

    // Drop existing collection to avoid duplicates
    try {
      await db.collection('interests').drop();
      console.log('Dropped existing interests collection');
    } catch (error) {
      console.log('No existing interests collection to drop');
    }

    // Create collection
    await db.createCollection('interests');
    console.log('Created interests collection');

    // Add default interests
    const result = await db.collection('interests').insertMany([
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

    console.log(`Inserted ${result.insertedCount} documents into interests collection`);
    
    // Verify the data
    const count = await db.collection('interests').countDocuments();
    console.log(`Total documents in interests collection: ${count}`);

    console.log('MongoDB interests setup completed successfully');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

setupMongoDB().catch(console.error);

