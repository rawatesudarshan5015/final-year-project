import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { verifyToken } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

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
      const [rows] = await connection.execute<StudentProfile[]>(
        'SELECT id, name, email, ern_number, branch, batch_year, section, mobile_number, profile_pic_url, cloudinary_public_id, COALESCE(interests, "{}") as interests FROM students WHERE id = ?',
        [decoded.id]
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

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { profile_pic_url, cloudinary_public_id, mobile_number, interests } = await request.json();

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      await connection.beginTransaction();

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
      if (mobile_number !== undefined || interests !== undefined) {
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