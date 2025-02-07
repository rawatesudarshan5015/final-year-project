import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface StudentProfile extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  interests?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    jwt.verify(token, process.env.JWT_SECRET!);
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      const [rows] = await connection.execute<StudentProfile[]>(
        'SELECT id, name, email, ern_number, branch, batch_year, section, COALESCE(interests, "{}") as interests FROM students WHERE id = ?',
        [params.id]
      );

      const student = rows[0];
      if (!student) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: {
          ...student,
          interests: student.interests ? JSON.parse(student.interests) : {}
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 