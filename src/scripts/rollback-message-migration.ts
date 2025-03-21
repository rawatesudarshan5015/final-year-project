import { getDatabase } from '@/lib/db';
import { connectToMongoDB } from '@/lib/db/mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function rollbackMessageMigration() {
  console.log('Starting rollback of message migration...');
  
  try {
    // Connect to MongoDB
    const mongoClient = await connectToMongoDB();
    
    // Drop the messages and conversations collections
    console.log('Dropping MongoDB collections...');
    await mongoClient.collection('messages').drop().catch(err => {
      if (err.code !== 26) { // Collection not found error
        throw err;
      }
      console.log('Messages collection does not exist, skipping drop');
    });
    
    await mongoClient.collection('conversations').drop().catch(err => {
      if (err.code !== 26) { // Collection not found error
        throw err;
      }
      console.log('Conversations collection does not exist, skipping drop');
    });
    
    console.log('MongoDB collections dropped successfully');
    console.log('Rollback completed successfully');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

// Run the rollback if this script is executed directly
if (require.main === module) {
  rollbackMessageMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Rollback failed:', error);
      process.exit(1);
    });
} 