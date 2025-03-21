import { getDatabase } from '@/lib/db';
import { getConversationsCollection, getMessagesCollection } from '@/lib/db/mongodb';
import { MongoConversation, MongoMessage } from '@/lib/db/types';
import { ObjectId } from 'mongodb';
import { RowDataPacket } from 'mysql2';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface MySQLMessage extends RowDataPacket {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
  sender_name: string;
}

interface MySQLConversation extends RowDataPacket {
  id: number;
  created_at: Date;
  participant_ids: string;
  participant_names: string;
}

interface MySQLParticipant extends RowDataPacket {
  conversation_id: number;
  student_id: number;
}

async function migrateMessagesToMongoDB() {
  console.log('Starting migration of messages from MySQL to MongoDB...');
  
  try {
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    
    // Step 1: Get all conversations from MySQL
    console.log('Fetching conversations from MySQL...');
    const [mysqlConversations] = await connection.execute<MySQLConversation[]>(
      `SELECT c.*, 
        GROUP_CONCAT(s.id) as participant_ids,
        GROUP_CONCAT(s.name) as participant_names
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       JOIN students s ON cp.student_id = s.id
       GROUP BY c.id`
    );
    
    console.log(`Found ${mysqlConversations.length} conversations in MySQL`);
    
    // Step 2: Create a mapping from MySQL conversation IDs to MongoDB ObjectIds
    const conversationIdMap = new Map<number, ObjectId>();
    const mongoConversationsCollection = await getConversationsCollection();
    
    // Step 3: Insert conversations into MongoDB
    console.log('Inserting conversations into MongoDB...');
    for (const mysqlConversation of mysqlConversations) {
      const participantIds = mysqlConversation.participant_ids.split(',').map(Number);
      const participantNames = mysqlConversation.participant_names.split(',');
      
      const participantDetails = participantIds.map((id, index) => ({
        id,
        name: participantNames[index]
      }));
      
      const mongoConversation: MongoConversation = {
        participants: participantIds,
        participant_details: participantDetails,
        created_at: mysqlConversation.created_at,
        updated_at: mysqlConversation.created_at
      };
      
      const result = await mongoConversationsCollection.insertOne(mongoConversation);
      conversationIdMap.set(mysqlConversation.id, result.insertedId);
    }
    
    console.log('Conversations migrated successfully');
    
    // Step 4: Get all messages from MySQL
    console.log('Fetching messages from MySQL...');
    const [mysqlMessages] = await connection.execute<MySQLMessage[]>(
      `SELECT m.*, s.name as sender_name
       FROM messages m
       JOIN students s ON m.sender_id = s.id
       ORDER BY m.conversation_id, m.created_at`
    );
    
    console.log(`Found ${mysqlMessages.length} messages in MySQL`);
    
    // Step 5: Insert messages into MongoDB
    console.log('Inserting messages into MongoDB...');
    const mongoMessagesCollection = await getMessagesCollection();
    const mongoMessages: MongoMessage[] = [];
    
    // Group messages by conversation for batch processing
    const messagesByConversation = new Map<number, MySQLMessage[]>();
    for (const message of mysqlMessages) {
      if (!messagesByConversation.has(message.conversation_id)) {
        messagesByConversation.set(message.conversation_id, []);
      }
      messagesByConversation.get(message.conversation_id)!.push(message);
    }
    
    // Process each conversation's messages
    for (const [mysqlConversationId, messages] of messagesByConversation.entries()) {
      const mongoConversationId = conversationIdMap.get(mysqlConversationId);
      if (!mongoConversationId) {
        console.warn(`No MongoDB ID found for MySQL conversation ${mysqlConversationId}`);
        continue;
      }
      
      // Convert messages to MongoDB format
      const conversationMessages = messages.map(message => ({
        conversation_id: mongoConversationId,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
        read_by: [message.sender_id], // Initially, only the sender has read the message
        sender_name: message.sender_name
      }));
      
      // Insert messages in batches
      if (conversationMessages.length > 0) {
        await mongoMessagesCollection.insertMany(conversationMessages);
        
        // Update the conversation with the last message
        const lastMessage = messages[messages.length - 1];
        await mongoConversationsCollection.updateOne(
          { _id: mongoConversationId },
          { 
            $set: { 
              last_message: {
                content: lastMessage.content,
                sender_id: lastMessage.sender_id,
                created_at: lastMessage.created_at
              },
              updated_at: lastMessage.created_at
            } 
          }
        );
      }
    }
    
    console.log('Messages migrated successfully');
    console.log('Migration completed successfully');
    
    // Optional: Verify the migration
    const totalMongoConversations = await mongoConversationsCollection.countDocuments();
    const totalMongoMessages = await mongoMessagesCollection.countDocuments();
    
    console.log(`Verification: ${totalMongoConversations} conversations and ${totalMongoMessages} messages in MongoDB`);
    
    connection.release();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateMessagesToMongoDB()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 