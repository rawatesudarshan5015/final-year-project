import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { getStudentRole } from '@/lib/utils';

interface StudentProfile extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  profile_pic_url?: string;
  interests?: string;
  current_internship?: string;
  work_history?: string;
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
      // First, check if the new columns exist
      const [columns] = await connection.execute<RowDataPacket[]>(
        "SHOW COLUMNS FROM students LIKE 'current_internship'"
      );
      
      const hasNewColumns = columns.length > 0;
      
      // Construct the query based on whether the new columns exist
      let query = 'SELECT id, name, email, ern_number, branch, batch_year, section, profile_pic_url, ' +
                  'COALESCE(interests, "{}") as interests';
      
      if (hasNewColumns) {
        query += ', COALESCE(current_internship, "null") as current_internship, ' +
                 'COALESCE(work_history, "[]") as work_history';
      }
      
      query += ' FROM students WHERE id = ?';

      const [rows] = await connection.execute<StudentProfile[]>(query, [params.id]);

      const student = rows[0];
      if (!student) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }

      // Calculate student role based on batch year
      const role = getStudentRole(student.batch_year);

      // Process profile picture URL
      const profile_pic_url = student.profile_pic_url
        ? student.profile_pic_url.startsWith('http') || student.profile_pic_url.startsWith('//')
          ? student.profile_pic_url
          : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${student.profile_pic_url}`
        : null;

      return NextResponse.json({
        success: true,
        profile: {
          ...student,
          profile_pic_url,
          interests: student.interests ? JSON.parse(student.interests) : {},
          current_internship: hasNewColumns && student.current_internship && student.current_internship !== 'null' 
            ? JSON.parse(student.current_internship) 
            : null,
          work_history: hasNewColumns && student.work_history ? JSON.parse(student.work_history) : [],
          role
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