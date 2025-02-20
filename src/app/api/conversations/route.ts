import { getDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const { participantIds } = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      await connection.beginTransaction();

      // Create new conversation
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO conversations () VALUES ()'
      );
      const conversationId = result.insertId;

      // Add all participants including the creator
      const allParticipants = [...new Set([...participantIds, user.id])];
      for (const participantId of allParticipants) {
        await connection.execute(
          'INSERT INTO conversation_participants (conversation_id, student_id) VALUES (?, ?)',
          [conversationId, participantId]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, conversationId });
    } catch (error) {
      await connection.rollback();
      throw error;
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
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      const [conversations] = await connection.execute(
        `SELECT c.*, 
          GROUP_CONCAT(s.name) as participant_names,
          GROUP_CONCAT(s.id) as participant_ids
         FROM conversations c
         JOIN conversation_participants cp ON c.id = cp.conversation_id
         JOIN students s ON cp.student_id = s.id
         WHERE c.id IN (
           SELECT conversation_id 
           FROM conversation_participants 
           WHERE student_id = ?
         )
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [user.id]
      );

      return NextResponse.json({ success: true, conversations });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Conversation retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
} 