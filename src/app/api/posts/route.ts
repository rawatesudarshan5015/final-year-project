import { NextResponse } from 'next/server';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    const { category, media_type, media_url, description, details } = await request.json();

    // Validate required fields based on category
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (category === 'event') {
      const requiredFields = ['event_name', 'organized_by', 'venue', 'date', 'time'];
      const missingFields = requiredFields.filter(field => !details?.[field]);
      if (missingFields.length > 0) {
        return NextResponse.json({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Similar validation for contest category

    const collection = await getPostsCollection();
    const post = {
      author_id: user.id,
      category,
      media_type: media_type || 'text',
      media_url,
      description,
      details,
      created_at: new Date().toISOString()
    };

    const result = await collection.insertOne(post);
    return NextResponse.json({ success: true, postId: result.insertedId });

  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('[GET /api/posts] Fetching posts with params:', { page, limit, skip });

    const collection = await getPostsCollection();
    
    // Get total count for pagination
    const total = await collection.countDocuments();
    
    const posts = await collection
      .find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('[GET /api/posts] Found posts:', posts.length);

    // Get author details from MySQL
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    try {
      const authorIds = posts.map(post => post.author_id);
      
      if (authorIds.length === 0) {
        console.log('[GET /api/posts] No posts found, returning empty array');
        return NextResponse.json({ 
          success: true, 
          posts: [],
          hasMore: false,
          total
        });
      }

      const placeholders = authorIds.map(() => '?').join(',');
      const [authors] = await connection.execute<RowDataPacket[]>(
        `SELECT id, name, profile_pic_url FROM students WHERE id IN (${placeholders})`,
        authorIds
      );

      const authorMap = new Map(authors.map(author => [author.id, author]));

      const postsWithAuthors = posts.map(post => ({
        ...post,
        author: authorMap.get(post.author_id) ? {
          id: authorMap.get(post.author_id)!.id,
          name: authorMap.get(post.author_id)!.name,
          profile_pic_url: authorMap.get(post.author_id)!.profile_pic_url || null
        } : undefined
      }));

      return NextResponse.json({ 
        success: true, 
        posts: postsWithAuthors,
        hasMore: skip + posts.length < total,
        total
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[GET /api/posts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve feed' },
      { status: 500 }
    );
  }
} 