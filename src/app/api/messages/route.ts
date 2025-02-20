import { getDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      await connection.beginTransaction();

      // First, check if a conversation exists between these users
      const [conversations] = await connection.execute<ConversationRow[]>(
        `SELECT c.id 
         FROM conversations c
         JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
         JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
         WHERE cp1.student_id = ? AND cp2.student_id = ?
         LIMIT 1`,
        [user.id, receiverId]
      );

      let conversationId;
      
      if (!Array.isArray(conversations) || conversations.length === 0) {
        // Create new conversation
        const [result] = await connection.execute<ResultSetHeader>(
          'INSERT INTO conversations () VALUES ()'
        );
        conversationId = result.insertId;

        // Add participants
        await connection.execute(
          'INSERT INTO conversation_participants (conversation_id, student_id) VALUES (?, ?)',
          [conversationId, user.id]
        );
        await connection.execute(
          'INSERT INTO conversation_participants (conversation_id, student_id) VALUES (?, ?)',
          [conversationId, receiverId]
        );
      } else {
        conversationId = conversations[0].id;
      }

      // Insert the message
      await connection.execute(
        `INSERT INTO messages (conversation_id, sender_id, content) 
         VALUES (?, ?, ?)`,
        [conversationId, user.id, content]
      );

      await connection.commit();
      return NextResponse.json({ success: true, conversationId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      const [messages] = await connection.execute(
        `SELECT m.*, s.name as sender_name 
         FROM messages m 
         JOIN students s ON m.sender_id = s.id 
         JOIN conversation_participants cp1 ON m.conversation_id = cp1.conversation_id
         JOIN conversation_participants cp2 ON m.conversation_id = cp2.conversation_id
         WHERE cp1.student_id = ? AND cp2.student_id = ?
         ORDER BY m.created_at DESC 
         LIMIT 50`,
        [user.id, receiverId]
      );

      return NextResponse.json({ success: true, messages });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Message retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get messages' },
      { status: 500 }
    );
  }
} 