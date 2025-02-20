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

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET!);

    const db = await getDatabase();
    const interests = await db.mongo.interests.find({}).toArray();
    
    if (!interests || interests.length === 0) {
      console.log('No interests found in database');
    }

    return NextResponse.json({
      success: true,
      interests
    });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
} 