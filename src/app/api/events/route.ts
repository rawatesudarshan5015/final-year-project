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
    
    const events = await collection
      .find({
        category: { $in: ['event', 'contest'] },
        'details.date': { $gte: new Date().toISOString().split('T')[0] } // Only future events
      })
      .sort({ 'details.date': 1, 'details.time': 1 })
      .toArray();

    // Get author details from MySQL
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();
    try {
      if (events.length === 0) {
        return NextResponse.json({ success: true, events: [] });
      }

      const authorIds = [...new Set(events.map(event => event.author_id))];
      console.log('[GET /api/events] Fetching author details for IDs:', authorIds);

      const [authors] = await connection.execute<RowDataPacket[]>(
        'SELECT id, name, profile_pic_url FROM students WHERE id IN (?)',
        [authorIds]
      );

      console.log('[GET /api/events] Found authors from MySQL:', authors.length);
      if (authors.length > 0) {
        console.log('[GET /api/events] First author sample:', {
          id: authors[0].id,
          name: authors[0].name,
          has_profile_pic: !!authors[0].profile_pic_url
        });
      }

      // Create a map of author details for quick lookup
      const authorMap = new Map(
        authors.map(author => [author.id, {
          id: author.id,
          name: author.name,
          profile_pic_url: author.profile_pic_url || null
        }])
      );

      // Add author details to each event
      const eventsWithAuthor = events.map(event => {
        console.log('[GET /api/events] Processing event', event._id, ':', {
          author_id: event.author_id,
          found_author: authorMap.has(event.author_id),
          author_details: authorMap.get(event.author_id)
            ? {
                id: authorMap.get(event.author_id)!.id,
                name: authorMap.get(event.author_id)!.name,
                has_profile_pic: !!authorMap.get(event.author_id)!.profile_pic_url
              }
            : null
        });

        return {
          ...event,
          author: authorMap.get(event.author_id)
        };
      });

      if (eventsWithAuthor.length > 0) {
        console.log('[GET /api/events] First processed event sample:', {
          _id: eventsWithAuthor[0]._id,
          author: eventsWithAuthor[0].author
        });
      }

      return NextResponse.json({ success: true, events: eventsWithAuthor });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Events retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
} 