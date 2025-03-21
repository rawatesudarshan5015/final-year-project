import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { alumni_id, post_id, message, resume_url } = await request.json();

    // Validate required fields
    if (!alumni_id || !post_id || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prevent self-referrals
    if (user.id === alumni_id) {
      return NextResponse.json(
        { success: false, error: 'You cannot request a referral from yourself' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      // Check if a request already exists for this student, alumni, and post
      const [existingRequests] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM referral_requests WHERE student_id = ? AND alumni_id = ? AND post_id = ?',
        [user.id, alumni_id, post_id]
      );

      if (existingRequests.length > 0) {
        return NextResponse.json(
          { success: false, error: 'You have already requested a referral for this post' },
          { status: 400 }
        );
      }

      // Create the referral request
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO referral_requests (student_id, alumni_id, post_id, message, resume_url) VALUES (?, ?, ?, ?, ?)',
        [user.id, alumni_id, post_id, message, resume_url || null]
      );

      return NextResponse.json({
        success: true,
        request_id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Referral request creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create referral request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sent'; // 'sent' or 'received'

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      let query = '';
      let params: any[] = [];

      if (type === 'sent') {
        // Get requests sent by the current user
        query = `
          SELECT r.*, s.name as alumni_name, s.profile_pic_url as alumni_profile_pic
          FROM referral_requests r
          JOIN students s ON r.alumni_id = s.id
          WHERE r.student_id = ?
          ORDER BY r.created_at DESC
        `;
        params = [user.id];
      } else {
        // Get requests received by the current user (as alumni)
        query = `
          SELECT r.*, s.name as student_name, s.profile_pic_url as student_profile_pic,
                 s.batch_year, s.branch, s.section
          FROM referral_requests r
          JOIN students s ON r.student_id = s.id
          WHERE r.alumni_id = ?
          ORDER BY r.created_at DESC
        `;
        params = [user.id];
      }

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);

      return NextResponse.json({
        success: true,
        requests: rows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Referral request retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve referral requests' },
      { status: 500 }
    );
  }
} 