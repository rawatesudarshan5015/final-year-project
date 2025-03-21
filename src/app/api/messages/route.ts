import { getDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getConversationsCollection, getMessagesCollection } from '@/lib/db/mongodb';
import { MongoConversation, MongoMessage } from '@/lib/db/types';
import { ObjectId } from 'mongodb';

interface ConversationRow extends RowDataPacket {
  id: number; // Define the expected structure
}

export async function POST(request: Request) {
  try {
    const { receiverId, content } = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    // Prevent self-messaging
    if (user.id === Number(receiverId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot send messages to yourself' },
        { status: 400 }
      );
    }

    // Get MongoDB collections
    const conversationsCollection = await getConversationsCollection();
    const messagesCollection = await getMessagesCollection();
    
    // Find existing conversation between these users
    const conversation = await conversationsCollection.findOne({
      participants: { $all: [user.id, Number(receiverId)] }
    });
    
    let conversationId: ObjectId;
    
    if (!conversation) {
      // Get participant details from MySQL
      const db = await getDatabase();
      const connection = await db.mysql.getConnection();
      
      try {
        // Get names for both participants
        const [participants] = await connection.execute<RowDataPacket[]>(
          'SELECT id, name FROM students WHERE id IN (?, ?)',
          [user.id, receiverId]
        );
        
        // Create participant details array
        const participantDetails = participants.map(p => ({
          id: p.id,
          name: p.name
        }));
        
        // Create new conversation
        const newConversation: MongoConversation = {
          participants: [user.id, Number(receiverId)],
          participant_details: participantDetails,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        const result = await conversationsCollection.insertOne(newConversation);
        conversationId = new ObjectId(result.insertedId);
      } finally {
        connection.release();
      }
    } else {
      conversationId = new ObjectId(conversation._id);
    }
    
    // Get sender name from MySQL for caching
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    let senderName = '';
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT name FROM students WHERE id = ?',
        [user.id]
      );
      
      if (rows.length > 0) {
        senderName = rows[0].name;
      }
    } finally {
      connection.release();
    }
    
    // Insert the message
    const message: MongoMessage = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      created_at: new Date(),
      read_by: [user.id],
      sender_name: senderName
    };
    
    await messagesCollection.insertOne(message);
    
    // Update the conversation with the last message
    await conversationsCollection.updateOne(
      { _id: conversationId },
      { 
        $set: { 
          last_message: {
            content: content,
            sender_id: user.id,
            created_at: new Date()
          },
          updated_at: new Date()
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      conversationId: conversationId.toString(),
      message: {
        _id: message._id,
        content: message.content,
        sender_id: message.sender_id,
        created_at: message.created_at
      }
    });
  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('with');
    
    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: 'Recipient ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent self-messaging
    if (user.id === Number(receiverId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot view messages with yourself' },
        { status: 400 }
      );
    }
    
    // Get MongoDB collections
    const conversationsCollection = await getConversationsCollection();
    const messagesCollection = await getMessagesCollection();
    
    // Find conversation between these users
    const conversation = await conversationsCollection.findOne({
      participants: { $all: [user.id, Number(receiverId)] }
    });
    
    if (!conversation) {
      // No conversation exists yet
      return NextResponse.json({ success: true, messages: [] });
    }
    
    // Get messages for this conversation
    const messages = await messagesCollection
      .find({ conversation_id: conversation._id as ObjectId })
      .sort({ created_at: 1 }) // Oldest first
      .limit(50)
      .toArray();
    
    // Mark messages as read
    const messagesToMark = messages
      .filter(msg => msg.sender_id !== user.id && !msg.read_by.includes(user.id))
      .map(msg => msg._id);
    
    if (messagesToMark.length > 0) {
      await messagesCollection.updateMany(
        { _id: { $in: messagesToMark } },
        { $addToSet: { read_by: user.id } }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      messages: messages.map(msg => ({
        _id: msg._id,
        id: msg._id, // For backward compatibility
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender_name: msg.sender_name,
        read_by: msg.read_by
      }))
    });
  } catch (error) {
    console.error('Message retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get messages' },
      { status: 500 }
    );
  }
} 