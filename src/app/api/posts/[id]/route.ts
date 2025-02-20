import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/aws/s3';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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
    const collection = await getPostsCollection();
    
    const post = await collection.findOne({
      _id: new ObjectId(params.id)
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get author details from MySQL
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    try {
      const [authors] = await connection.execute<RowDataPacket[]>(
        'SELECT id, name, profile_pic_url FROM students WHERE id = ?',
        [post.author_id]
      );

      const postWithAuthor = {
        ...post,
        author: authors[0] ? {
          id: authors[0].id,
          name: authors[0].name,
          profile_pic_url: authors[0].profile_pic_url || null
        } : undefined
      };

      console.log('[GET /api/posts/[id]] Returning post with author:', {
        post_id: post._id,
        author_id: post.author_id,
        author: postWithAuthor.author
      });

      return NextResponse.json({ success: true, post: postWithAuthor });
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Post retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve post' },
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
    const collection = await getPostsCollection();
    
    // Check if post exists and belongs to user
    const post = await collection.findOne({
      _id: new ObjectId(params.id),
      author_id: user.id
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    // Delete associated media if exists
    if (post.media_url) {
      // Delete from S3
      const key = post.media_url.split('/').pop();
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: `uploads/${key}`
      });
      await s3Client.send(command);
    }

    // Delete post
    await collection.deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
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
    const collection = await getPostsCollection();
    const { category, description, details } = await request.json();

    const post = await collection.findOne({
      _id: new ObjectId(params.id),
      author_id: user.id
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { category, description, details, updated_at: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
} 