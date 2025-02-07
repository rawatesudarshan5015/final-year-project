import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('with');
    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const db = await getDatabase();

    const messages = await db.mongo.messages
      .find({
        $or: [
          { sender_id: decoded.id, receiver_id: parseInt(recipientId) },
          { sender_id: parseInt(recipientId), receiver_id: decoded.id }
        ]
      })
      .sort({ sent_at: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const { recipient_id, content } = await request.json();

    const db = await getDatabase();
    const message = {
      sender_id: decoded.id,
      receiver_id: recipient_id,
      content,
      sent_at: new Date()
    };

    const result = await db.mongo.messages.insertOne(message);

    return NextResponse.json({
      success: true,
      message: { ...message, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 