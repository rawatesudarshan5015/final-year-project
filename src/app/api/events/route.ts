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

      // Ensure all author IDs are numbers for consistency with MySQL
      const numericAuthorIds = authorIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
      console.log('[GET /api/events] Converted author IDs to numeric:', numericAuthorIds);

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
      
      query += ` FROM students WHERE id IN (?)`;

      const [authors] = await connection.execute<RowDataPacket[]>(query, [numericAuthorIds]);

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
        authors.map(author => {
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
          
          // Log the author data we're adding to the map
          console.log('[GET /api/events] Adding author to map:', {
            author_id: author.id,
            author_id_type: typeof author.id,
            name: author.name
          });
          
          // Ensure we use a consistent ID format (number) for the map key
          return [Number(author.id), authorData];
        })
      );

      // Add author details to each event
      const eventsWithAuthor = events.map(event => {
        // Ensure author_id is in the correct format for comparison
        const authorId = typeof event.author_id === 'string' 
          ? parseInt(event.author_id, 10) 
          : event.author_id;
        
        // Check if we found the author
        const foundAuthor = authorMap.has(authorId);
        const authorDetails = foundAuthor ? authorMap.get(authorId) : null;
        
        console.log('[GET /api/events] Processing event', event._id, ':', {
          author_id: authorId,
          author_id_type: typeof authorId,
          original_author_id: event.author_id,
          original_author_id_type: typeof event.author_id,
          found_author: foundAuthor,
          keys_in_map: Array.from(authorMap.keys()).slice(0, 5), // Just show the first 5 keys
          author_details: authorDetails
            ? {
                id: authorDetails.id,
                name: authorDetails.name,
                has_profile_pic: !!authorDetails.profile_pic_url
              }
            : null
        });

        return {
          ...event,
          author: authorDetails
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