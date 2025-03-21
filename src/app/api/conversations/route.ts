import { getDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getConversationsCollection } from '@/lib/db/mongodb';
import { MongoConversation } from '@/lib/db/types';

export async function POST(request: Request) {
  try {
    const { participantIds } = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    // Validate participants
    const allParticipants = [...new Set([...participantIds, user.id])];
    if (allParticipants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least one participant is required' },
        { status: 400 }
      );
    }
    
    // Get MongoDB collections
    const conversationsCollection = await getConversationsCollection();
    
    // Check if conversation already exists with these exact participants
    const existingConversation = await conversationsCollection.findOne({
      participants: { $size: allParticipants.length, $all: allParticipants }
    });
    
    if (existingConversation) {
      return NextResponse.json({ 
        success: true, 
        conversationId: existingConversation._id,
        existing: true
      });
    }
    
    // Get participant details from MySQL
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    
    try {
      // Get names for all participants
      const placeholders = allParticipants.map(() => '?').join(',');
      const [participants] = await connection.execute<RowDataPacket[]>(
        `SELECT id, name FROM students WHERE id IN (${placeholders})`,
        allParticipants
      );
      
      // Create participant details array
      const participantDetails = participants.map(p => ({
        id: p.id,
        name: p.name
      }));
      
      // Create new conversation
      const newConversation: MongoConversation = {
        participants: allParticipants,
        participant_details: participantDetails,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await conversationsCollection.insertOne(newConversation);
      
      return NextResponse.json({ 
        success: true, 
        conversationId: result.insertedId,
        existing: false
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Conversation creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
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
    
    // Get MongoDB collections
    const conversationsCollection = await getConversationsCollection();
    
    // Find all conversations where the user is a participant
    const conversations = await conversationsCollection
      .find({ participants: user.id })
      .sort({ updated_at: -1 })
      .toArray();
    
    // Format the response
    const formattedConversations = conversations.map(conv => ({
      _id: conv._id,
      id: conv._id, // For backward compatibility
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      participants: conv.participants,
      participant_names: conv.participant_details
        ?.filter(p => p.id !== user.id)
        .map(p => p.name)
        .join(', '),
      participant_ids: conv.participants
        .filter(id => id !== user.id)
        .join(','),
      last_message: conv.last_message
    }));
    
    return NextResponse.json({ success: true, conversations: formattedConversations });
  } catch (error) {
    console.error('Conversation retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
} 