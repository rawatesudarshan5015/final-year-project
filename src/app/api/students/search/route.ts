import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { getStudentRole } from '@/lib/utils';

interface StudentResult extends RowDataPacket {
  id: number;
  name: string;
  ern_number: string;
  branch: string;
  section: string;
  batch_year: number;
  current_internship?: string;
  work_history?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('query');

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      // Check if the new columns exist
      const [columns] = await connection.execute<RowDataPacket[]>(
        "SHOW COLUMNS FROM students LIKE 'current_internship'"
      );
      
      const hasNewColumns = columns.length > 0;
      
      // Construct the query based on whether the new columns exist
      let sqlQuery = `SELECT id, name, ern_number, branch, section, batch_year`;
      
      if (hasNewColumns) {
        sqlQuery += `, COALESCE(current_internship, "null") as current_internship, 
                   COALESCE(work_history, "[]") as work_history`;
      }
      
      sqlQuery += ` FROM students WHERE name LIKE ? AND id != ? LIMIT 10`;

      const [rows] = await connection.execute<StudentResult[]>(
        sqlQuery,
        [`%${searchQuery}%`, decoded.id]
      );

      // Process the results to include role and format company info
      const processedResults = rows.map(student => {
        const role = getStudentRole(student.batch_year);
        
        // Process company information if available
        let companyInfo = null;
        if (hasNewColumns) {
          if (student.current_internship && student.current_internship !== 'null') {
            const internship = JSON.parse(student.current_internship);
            companyInfo = {
              company_name: internship.company_name,
              position: internship.position
            };
          } else if (student.work_history && student.work_history !== '[]') {
            const workHistory = JSON.parse(student.work_history);
            const currentJob = workHistory.find((job: any) => job.is_current);
            if (currentJob) {
              companyInfo = {
                company_name: currentJob.company_name,
                position: currentJob.position
              };
            }
          }
        }
        
        return {
          id: student.id,
          name: student.name,
          branch: student.branch,
          section: student.section,
          batch_year: student.batch_year,
          role,
          company_info: companyInfo
        };
      });

      return NextResponse.json({
        success: true,
        students: processedResults
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
} 