import { MongoClient, ObjectId } from 'mongodb';
import { MongoDBCollections, EmailLog, UploadLog, Post, MongoMessage, MongoConversation, Interest } from './types';
import { logger } from '../logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

let client: MongoClient | null = null;

export async function getMongoDb(): Promise<MongoDBCollections> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    if (!dbName) {
      throw new Error('MONGODB_DB is not defined');
    }

    if (!client) {
      client = new MongoClient(mongoUri, {
        connectTimeoutMS: 10000, // Increased timeout for Atlas connections
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10, // Recommended for Atlas connections
      });
      await client.connect();
      logger.info('Connected to MongoDB Atlas');
    }

    const db = client.db(dbName);

    // Create collections if they don't exist
    const collections = ['logs', 'upload_logs', 'email_logs', 'posts', 'messages', 'interests', 'conversations'];
    for (const collection of collections) {
      const exists = await db.listCollections({ name: collection }).hasNext();
      if (!exists) {
        await db.createCollection(collection);
      }
    }

    // Create indexes for messages and conversations
    const messagesCollection = db.collection<MongoMessage>('messages');
    await messagesCollection.createIndex({ conversation_id: 1, created_at: -1 });
    await messagesCollection.createIndex({ sender_id: 1 });
    
    const conversationsCollection = db.collection<MongoConversation>('conversations');
    await conversationsCollection.createIndex({ participants: 1 });
    await conversationsCollection.createIndex({ updated_at: -1 });
    await conversationsCollection.createIndex({ "participants": 1, "updated_at": -1 });

    return {
      logs: db.collection('logs'),
      uploadLogs: db.collection<UploadLog>('upload_logs'),
      emailLogs: db.collection<EmailLog>('email_logs'),
      posts: db.collection<Post>('posts'),
      messages: db.collection<MongoMessage>('messages'),
      interests: db.collection<Interest>('interests'),
      conversations: db.collection<MongoConversation>('conversations')
    };
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB. Please check if MongoDB is running and the connection string is correct.');
  }
}

export async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
  }
  return client.db(process.env.MONGODB_DB);
}

export async function getPostsCollection() {
  const db = await connectToMongoDB();
  const collection = db.collection<Post>('posts');
  
  // Ensure indexes
  await collection.createIndex({ created_at: -1 });
  await collection.createIndex({ category: 1 });
  
  return collection;
}

export async function getMessagesCollection() {
  const db = await connectToMongoDB();
  const collection = db.collection<MongoMessage>('messages');
  
  // Ensure indexes
  await collection.createIndex({ conversation_id: 1, created_at: -1 });
  await collection.createIndex({ sender_id: 1 });
  
  return collection;
}

export async function getConversationsCollection() {
  const db = await connectToMongoDB();
  const collection = db.collection<MongoConversation>('conversations');
  
  // Ensure indexes
  await collection.createIndex({ participants: 1 });
  await collection.createIndex({ updated_at: -1 });
  await collection.createIndex({ "participants": 1, "updated_at": -1 });
  
  return collection;
}

// Add this to handle cleanup on app shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}); 