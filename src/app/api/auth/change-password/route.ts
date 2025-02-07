import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface StudentRow extends RowDataPacket {
  id: number;
  password: string;
}

interface TokenPayload {
  id: number;
  email: string;
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

    // Verify token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      const [rows] = await connection.execute<StudentRow[]>(
        'SELECT * FROM students WHERE id = ?',
        [decoded.id]
      );

      const student = rows[0];
      if (!student || !(await bcrypt.compare(currentPassword, student.password))) {
        return NextResponse.json(
          { success: false, error: 'Invalid current password' },
          { status: 400 }
        );
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await connection.execute(
        'UPDATE students SET password = ?, first_login = FALSE WHERE id = ?',
        [hashedNewPassword, decoded.id]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'Password change failed' },
      { status: 500 }
    );
  }
} 