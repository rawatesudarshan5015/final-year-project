import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      // Get the referral request with student and alumni details
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT r.*, 
                s1.name as student_name, s1.profile_pic_url as student_profile_pic,
                s1.batch_year as student_batch_year, s1.branch as student_branch, s1.section as student_section,
                s2.name as alumni_name, s2.profile_pic_url as alumni_profile_pic
         FROM referral_requests r
         JOIN students s1 ON r.student_id = s1.id
         JOIN students s2 ON r.alumni_id = s2.id
         WHERE r.id = ? AND (r.student_id = ? OR r.alumni_id = ?)`,
        [params.id, user.id, user.id]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Referral request not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        request: rows[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Referral request retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve referral request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { status } = await request.json();

    // Validate status
    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "accepted" or "declined"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      // Verify the user is the alumni who received the request
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM referral_requests WHERE id = ? AND alumni_id = ?',
        [params.id, user.id]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Referral request not found or unauthorized' },
          { status: 404 }
        );
      }

      // Update the request status
      await connection.execute(
        'UPDATE referral_requests SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, params.id]
      );

      return NextResponse.json({
        success: true,
        message: `Referral request ${status}`
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Referral request update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update referral request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      // Verify the user is the student who sent the request
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM referral_requests WHERE id = ? AND student_id = ?',
        [params.id, user.id]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Referral request not found or unauthorized' },
          { status: 404 }
        );
      }

      // Delete the request
      await connection.execute(
        'DELETE FROM referral_requests WHERE id = ?',
        [params.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Referral request deleted'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Referral request deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete referral request' },
      { status: 500 }
    );
  }
} 