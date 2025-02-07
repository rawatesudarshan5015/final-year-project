import { MongoClient } from 'mongodb';
import { MongoDBCollections, EmailLog, UploadLog } from './types';
import { logger } from '../logger';

let client: MongoClient | null = null;

export async function getMongoDb(): Promise<MongoDBCollections> {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }

    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await client.connect();
      logger.info('Connected to MongoDB');
    }

    const db = client.db(process.env.MONGODB_DB);

    return {
      logs: db.collection('logs'),
      uploadLogs: db.collection<UploadLog>('upload_logs'),
      emailLogs: db.collection<EmailLog>('email_logs')
    };
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB. Please check if MongoDB is running and the connection string is correct.');
  }
}

// Add this to handle cleanup on app shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}); 