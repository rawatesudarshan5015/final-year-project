import { MongoClient } from "mongodb";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupMongoDB() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('Checking MongoDB URI:', mongoUri ? 'Found' : 'Not found');

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables. Check .env.local file');
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Use the college_social database explicitly
    const db = client.db('college_social');
    console.log('Using database: college_social');

    // Drop the existing interests collection if it exists
    try {
      await db.collection('interests').drop();
      console.log('Dropped existing interests collection');
    } catch (error) {
      console.log('No existing interests collection to drop');
    }

    // Create new interests collection
    await db.createCollection('interests');
    console.log('Created new interests collection');

    // Insert interests data
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

    console.log(`Inserted ${result.insertedCount} documents`);

    // Verify the data
    const interests = await db.collection('interests').find({}).toArray();
    console.log('Inserted interests:', JSON.stringify(interests, null, 2));

    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

setupMongoDB().catch(console.error); 