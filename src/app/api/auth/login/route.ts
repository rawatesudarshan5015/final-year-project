import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface StudentRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  first_login: boolean;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    
    try {
      const [rows] = await connection.execute<StudentRow[]>(
        'SELECT * FROM students WHERE email = ?',
        [email]
      );

      const student = rows[0];
      if (!student || !(await bcrypt.compare(password, student.password))) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { id: student.id, email: student.email },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        token,
        requirePasswordChange: student.first_login,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 