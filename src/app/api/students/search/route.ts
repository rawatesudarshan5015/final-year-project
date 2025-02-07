import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface StudentResult extends RowDataPacket {
  id: number;
  name: string;
  ern_number: string;
  branch: string;
  section: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      const [rows] = await connection.execute<StudentResult[]>(
        'SELECT id, name, ern_number, branch, section FROM students WHERE name LIKE ? AND id != ?',
        [`%${query}%`, decoded.id]
      );

      return NextResponse.json({
        success: true,
        students: rows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
} 