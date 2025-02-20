import { NextResponse } from 'next/server';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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

      const [authors] = await connection.execute<RowDataPacket[]>(
        'SELECT id, name, profile_pic_url FROM students WHERE id = ?',
        [user.id]
      );

      console.log('[GET /api/posts/user] Found author:', authors[0]);

      const postsWithAuthor = posts.map(post => ({
        ...post,
        author: authors[0] ? {
          id: authors[0].id,
          name: authors[0].name,
          profile_pic_url: authors[0].profile_pic_url || null
        } : undefined
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