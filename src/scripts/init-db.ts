import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initializeDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB);

    // Create collections
    const collections = ['logs', 'upload_logs', 'email_logs', 'posts', 'messages', 'interests'];
    
    for (const collection of collections) {
      try {
        await db.createCollection(collection);
        console.log(`Created collection: ${collection}`);
      } catch (error: any) {
        if (error.code === 48) {
          console.log(`Collection ${collection} already exists`);
        } else {
          throw error;
        }
      }
    }

    // Add default interests if they don't exist
    const interestsCount = await db.collection('interests').countDocuments();
    if (interestsCount === 0) {
      await db.collection('interests').insertMany([
        {
          category: 'sports',
          options: ['Cricket', 'Football', 'Basketball', 'Volleyball', 'Badminton']
        },
        {
          category: 'hobbies',
          options: ['Reading', 'Gaming', 'Music', 'Dancing', 'Photography']
        },
        {
          category: 'domain',
          options: ['Web Development', 'Mobile Apps', 'AI/ML', 'Cybersecurity', 'Cloud Computing']
        }
      ]);
      console.log('Added default interests');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

initializeDatabase().catch(console.error); 