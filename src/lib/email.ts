import nodemailer from 'nodemailer';
import { getDatabase } from './db';
import { EmailLog } from './db/types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendLoginCredentials(
  studentName: string,
  studentEmail: string,
  tempPassword: string
) {
  try {
    console.log('Attempting to send email to:', studentEmail);
    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      // Don't log the actual password
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: studentEmail,
      subject: 'Welcome to the College Social Platform! 🎓',
      html: `
        <h2>Hello ${studentName},</h2>
        <p>You have been registered on our college social platform.</p>
        <p>Your login credentials are as follows:</p>
        <p><strong>Email:</strong> ${studentEmail}<br>
        <strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
        <br>
        <p>Regards,<br>${process.env.COLLEGE_NAME} Admin Team</p>
      `,
    });

    console.log('Email sent successfully:', info.messageId);

    const db = await getDatabase();
    
    // Log successful email
    await db.mongo.emailLogs.insertOne({
      studentEmail,
      messageId: info.messageId,
      status: 'sent',
      timestamp: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    const db = await getDatabase();
    
    // Log failed email
    await db.mongo.emailLogs.insertOne({
      studentEmail,
      error: error instanceof Error ? error.message : String(error),
      status: 'failed',
      timestamp: new Date(),
    });

    throw error;
  }
} 