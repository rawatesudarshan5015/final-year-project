import { NextResponse } from 'next/server';
import { parse } from 'csv-parse';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendLoginCredentials } from '@/lib/email';
import { generateTempPassword } from '@/lib/utils';

interface StudentData {
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  password?: string;
  mobile_number?: string;
}

export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token || token !== 'demo-admin-token') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const records: StudentData[] = [];
    let newCount = 0;
    let updateCount = 0;
    let emailErrors = 0;

    // Parse CSV
    const parser = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true
    });

    const db = await getDatabase();
    const connection = await db.mysql.getConnection();

    try {
      await connection.beginTransaction();

      for await (const record of parser) {
        // Check if student exists
        const [existing] = await connection.execute(
          'SELECT id FROM students WHERE ern_number = ?',
          [record.ern_number]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          // Update existing student - now including mobile_number
          await connection.execute(
            `UPDATE students 
             SET name = ?, email = ?, branch = ?, batch_year = ?, 
                 section = ?, mobile_number = ?
             WHERE ern_number = ?`,
            [
              record.name,
              record.email,
              record.branch,
              parseInt(record.batch_year),
              record.section,
              record.mobile_number || null,  // Handle empty mobile numbers
              record.ern_number
            ]
          );
          updateCount++;
        } else {
          // Add new student - now including mobile_number
          const tempPassword = generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          await connection.execute(
            `INSERT INTO students (
              name, email, ern_number, branch, batch_year, section,
              mobile_number, password, first_login
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
              record.name,
              record.email,
              record.ern_number,
              record.branch,
              parseInt(record.batch_year),
              record.section,
              record.mobile_number || null,  // Handle empty mobile numbers
              hashedPassword
            ]
          );

          // Try to send email, but don't fail if email sending fails
          try {
            await sendLoginCredentials(
              record.name,
              record.email,
              tempPassword
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            emailErrors++;
          }

          newCount++;
        }
      }

      await connection.commit();
      return NextResponse.json({
        success: true,
        message: `Processed ${newCount + updateCount} records (${newCount} new, ${updateCount} updated)${
          emailErrors > 0 ? `. Warning: ${emailErrors} emails failed to send` : ''
        }`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process file' },
      { status: 500 }
    );
  }
} 