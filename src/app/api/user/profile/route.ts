import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { verifyToken } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { getStudentRole } from '@/lib/utils';

interface StudentProfile extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  mobile_number?: string;
  interests?: string;
  profile_pic_url?: string;
  cloudinary_public_id?: string;
  current_internship?: string;
  work_history?: string;
}

export async function GET(request: Request) {
  try {
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
      // First, check if the new columns exist
      const [columns] = await connection.execute<RowDataPacket[]>(
        "SHOW COLUMNS FROM students LIKE 'current_internship'"
      );
      
      const hasNewColumns = columns.length > 0;
      
      // Construct the query based on whether the new columns exist
      let query = 'SELECT id, name, email, ern_number, branch, batch_year, section, mobile_number, profile_pic_url, cloudinary_public_id, ' +
                  'COALESCE(interests, "{}") as interests';
      
      if (hasNewColumns) {
        query += ', COALESCE(current_internship, "null") as current_internship, ' +
                 'COALESCE(work_history, "[]") as work_history';
      }
      
      query += ' FROM students WHERE id = ?';

      const [rows] = await connection.execute<StudentProfile[]>(query, [decoded.id]);

      const student = rows[0];
      if (!student) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }

      // Calculate student role based on batch year
      const role = getStudentRole(student.batch_year);

      return NextResponse.json({
        success: true,
        profile: {
          ...student,
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

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { 
      profile_pic_url, 
      cloudinary_public_id, 
      mobile_number, 
      interests,
      current_internship,
      work_history
    } = await request.json();

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      await connection.beginTransaction();

      // Check if the new columns exist
      const [columns] = await connection.execute<RowDataPacket[]>(
        "SHOW COLUMNS FROM students LIKE 'current_internship'"
      );
      
      const hasNewColumns = columns.length > 0;

      // If there's a new profile picture
      if (profile_pic_url) {
        // Get current public_id to delete old image
        const [currentProfile] = await connection.execute<RowDataPacket[]>(
          'SELECT cloudinary_public_id FROM students WHERE id = ?',
          [user.id]
        );

        // Delete old image if it exists
        if (currentProfile[0]?.cloudinary_public_id) {
          await deleteFromCloudinary(currentProfile[0].cloudinary_public_id);
        }

        // Update profile with new image
        await connection.execute(
          'UPDATE students SET profile_pic_url = ?, cloudinary_public_id = ? WHERE id = ?',
          [profile_pic_url, cloudinary_public_id, user.id]
        );
      }

      // Update other profile fields
      const shouldUpdateFields = mobile_number !== undefined || 
                                interests !== undefined || 
                                (hasNewColumns && (current_internship !== undefined || work_history !== undefined));
      
      if (shouldUpdateFields) {
        const updates = [];
        const values = [];

        if (mobile_number !== undefined) {
          updates.push('mobile_number = ?');
          values.push(mobile_number);
        }

        if (interests !== undefined) {
          updates.push('interests = ?');
          values.push(JSON.stringify(interests));
        }
        
        if (hasNewColumns) {
          if (current_internship !== undefined) {
            updates.push('current_internship = ?');
            values.push(JSON.stringify(current_internship));
          }
          
          if (work_history !== undefined) {
            updates.push('work_history = ?');
            values.push(JSON.stringify(work_history));
          }
        }

        if (updates.length > 0) {
          await connection.execute(
            `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
            [...values, user.id]
          );
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 