import { NextResponse } from 'next/server';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getStudentRole } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const collection = await getPostsCollection();

    const posts = await collection
      .find({ author_id: user.id })
      .sort({ created_at: -1 })
      .toArray();

    // Get author details from MySQL
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    try {
      if (posts.length === 0) {
        return NextResponse.json({ success: true, posts: [] });
      }

      // Check if the new columns exist
      const [columns] = await connection.execute<RowDataPacket[]>(
        "SHOW COLUMNS FROM students LIKE 'current_internship'"
      );
      
      const hasNewColumns = columns.length > 0;
      
      // Construct the query based on whether the new columns exist
      let query = `SELECT id, name, profile_pic_url, batch_year`;
      
      if (hasNewColumns) {
        query += `, COALESCE(current_internship, "null") as current_internship, 
                   COALESCE(work_history, "[]") as work_history`;
      }
      
      query += ` FROM students WHERE id = ?`;

      const [authors] = await connection.execute<RowDataPacket[]>(query, [user.id]);

      console.log('[GET /api/posts/user] Found author:', authors[0]);

      const authorData = authors[0];
      const role = authorData ? getStudentRole(authorData.batch_year) : undefined;
      
      const author: any = authorData ? {
        id: authorData.id,
        name: authorData.name,
        profile_pic_url: authorData.profile_pic_url || null,
        role
      } : undefined;
      
      if (hasNewColumns && authorData) {
        author.current_internship = authorData.current_internship && authorData.current_internship !== 'null'
          ? JSON.parse(authorData.current_internship)
          : null;
        author.work_history = authorData.work_history
          ? JSON.parse(authorData.work_history)
          : [];
      }

      const postsWithAuthor = posts.map(post => ({
        ...post,
        author
      }));

      console.log('[GET /api/posts/user] First post sample:', {
        post_id: postsWithAuthor[0]?._id,
        author: postsWithAuthor[0]?.author
      });

      return NextResponse.json({ success: true, posts: postsWithAuthor });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('User posts retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve posts' },
      { status: 500 }
    );
  }
} 