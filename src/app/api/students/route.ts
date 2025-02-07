import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { sendLoginCredentials } from '@/lib/email';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateTempPassword } from '@/lib/utils';
import { UploadLog } from '@/lib/db/types';

const studentSchema = z.object({
  ern_number: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  branch: z.string().min(1),
  batch_year: z.coerce.number().int().min(2000),
  section: z.string().min(1),
  mobile_number: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const students = await request.json();
    const db = await getDatabase();
    
    const uploadLog: UploadLog = {
      startTime: new Date(),
      totalRecords: students.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    const connection = await db.mysql.getConnection();
    try {
      await connection.beginTransaction();

      for (const student of students) {
        try {
          const validatedStudent = studentSchema.parse(student);
          
          // Check if student already exists
          const [existingStudents] = await connection.execute(
            'SELECT id FROM students WHERE ern_number = ?',
            [validatedStudent.ern_number]
          );

          if (Array.isArray(existingStudents) && existingStudents.length > 0) {
            uploadLog.errorCount++;
            uploadLog.errors.push({
              ern_number: student.ern_number,
              error: 'Student already exists'
            });
            continue; // Skip this student
          }

          const tempPassword = generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          await connection.execute(
            `INSERT INTO students (
              ern_number, name, email, branch, batch_year, section,
              mobile_number, password, first_login
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
              validatedStudent.ern_number,
              validatedStudent.name,
              validatedStudent.email,
              validatedStudent.branch,
              validatedStudent.batch_year,
              validatedStudent.section,
              validatedStudent.mobile_number || null,
              hashedPassword,
            ]
          );

          await sendLoginCredentials(
            validatedStudent.name,
            validatedStudent.email,
            tempPassword
          );

          uploadLog.successCount++;
        } catch (error) {
          uploadLog.errorCount++;
          uploadLog.errors.push({
            ern_number: student.ern_number,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await connection.commit();
      uploadLog.endTime = new Date();
      await db.mongo.uploadLogs.insertOne(uploadLog);

      return NextResponse.json({ 
        success: true, 
        totalProcessed: students.length,
        successCount: uploadLog.successCount,
        errorCount: uploadLog.errorCount,
        errors: uploadLog.errors
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error processing students:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process students',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}