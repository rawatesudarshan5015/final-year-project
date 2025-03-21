import { NextResponse } from 'next/server';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getStudentRole } from '@/lib/utils';

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

    // Check if user is alumni for alumni_referral posts
    if (category === 'alumni_referral') {
      // Get user details from database to check role
      const db = await getDatabase();
      const connection = await db.mysql.getConnection();
      
      try {
        const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT batch_year FROM students WHERE id = ?',
          [user.id]
        );
        
        if (rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const userRole = getStudentRole(rows[0].batch_year);
        
        if (userRole !== 'Alumni') {
          return NextResponse.json({ 
            success: false, 
            error: 'Only alumni can create referral posts' 
          }, { status: 403 });
        }
        
        // Validate required fields for alumni_referral
        if (!details?.company_name || !details?.position || !details?.referral_type) {
          return NextResponse.json({ 
            error: 'Missing required fields for referral post: company name, position, and referral type are required' 
          }, { status: 400 });
        }
      } finally {
        connection.release();
      }
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
    const category = searchParams.get('category');
    const skip = (page - 1) * limit;

    console.log('[GET /api/posts] Fetching posts with params:', { page, limit, skip, category });

    const collection = await getPostsCollection();
    
    // Build query filter
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    
    // Get total count for pagination
    const total = await collection.countDocuments(filter);
    
    const posts = await collection
      .find(filter)
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
      
      query += ` FROM students WHERE id IN (${authorIds.map(() => '?').join(',')})`;

      const [authors] = await connection.execute<RowDataPacket[]>(query, authorIds);

      const authorMap = new Map(authors.map(author => {
        const role = getStudentRole(author.batch_year);
        const authorData: any = {
          id: author.id,
          name: author.name,
          profile_pic_url: author.profile_pic_url || null,
          role
        };
        
        if (hasNewColumns) {
          authorData.current_internship = author.current_internship && author.current_internship !== 'null'
            ? JSON.parse(author.current_internship)
            : null;
          authorData.work_history = author.work_history
            ? JSON.parse(author.work_history)
            : [];
        }
        
        return [author.id, authorData];
      }));

      const postsWithAuthors = posts.map(post => {
        const authorData = authorMap.get(post.author_id);
        
        return {
          ...post,
          author: authorData
        };
      });

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