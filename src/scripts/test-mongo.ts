import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testMongoConnection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    console.log('Environment Check:');
    console.log('MongoDB URI:', mongoUri);
    console.log('Database Name:', dbName);
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db(dbName || 'college_db');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('MongoDB connection test successful!');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  }
}

testMongoConnection(); 