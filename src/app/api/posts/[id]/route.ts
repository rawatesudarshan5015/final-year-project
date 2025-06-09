import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getPostsCollection } from '@/lib/db/mongodb';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getStudentRole } from '@/lib/utils';
import { deleteFromCloudinary } from '@/lib/cloudinary';

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

      const [authors] = await connection.execute<RowDataPacket[]>(query, [post.author_id]);

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

      const postWithAuthor = {
        ...post,
        author
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

    console.log('Verifying token with secret:', process.env.JWT_SECRET);
    const user = verifyToken(token);
    console.log('Decoded token:', user);
    
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
      try {
        let publicId = post.cloudinary_public_id;
        
        // If there's no cloudinary_public_id but there is a media_url, try to extract it from the URL
        if (!publicId && post.media_url.includes('cloudinary.com')) {
          // Extract the public ID from Cloudinary URL
          // Format is typically: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
          const urlParts = post.media_url.split('/');
          const fileNameWithExt = urlParts[urlParts.length - 1];
          const fileName = fileNameWithExt.split('.')[0]; // Remove extension
          
          // Find the upload part index
          const uploadIndex = urlParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
            // Everything after 'upload' is part of the public ID
            publicId = urlParts.slice(uploadIndex + 1).join('/');
            // Remove any version number (v1234567890)
            if (publicId.startsWith('v') && /^v\d+/.test(publicId.split('/')[0])) {
              publicId = publicId.split('/').slice(1).join('/');
            }
            
            // Remove file extension if present
            if (publicId.includes('.')) {
              publicId = publicId.substring(0, publicId.lastIndexOf('.'));
            }
          }
        }
        
        if (publicId) {
          // Delete from Cloudinary using the public_id
          await deleteFromCloudinary(publicId);
          console.log('Successfully deleted media from Cloudinary');
        } else {
          console.log('Could not determine Cloudinary public_id, skipping media deletion');
        }
      } catch (mediaError) {
        // Log media deletion error but continue with post deletion
        console.error('Failed to delete media from Cloudinary, continuing with post deletion:', mediaError);
      }
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