import { Collection, Document } from 'mongodb';

export interface EmailLog {
  studentEmail: string;
  messageId?: string;
  status: 'sent' | 'failed';
  error?: string;
  timestamp: Date;
}

export interface UploadLog {
  startTime: Date;
  endTime?: Date;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    ern_number: string;
    error: string;
  }>;
}

export interface MongoDBCollections {
  logs: Collection<Document>;
  uploadLogs: Collection<UploadLog>;
  emailLogs: Collection<EmailLog>;
} 