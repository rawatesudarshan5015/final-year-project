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

export interface Post {
  _id?: string;
  author_id: number;
  content: string;
  created_at: Date;
}

export interface Message {
  _id?: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: Date;
}

export interface Interest {
  _id?: string;
  category: string;
  options: string[];
}

export interface MongoDBCollections {
  logs: Collection<Document>;
  uploadLogs: Collection<UploadLog>;
  emailLogs: Collection<EmailLog>;
  posts: Collection<Post>;
  messages: Collection<Message>;
  interests: Collection<Interest>;
} 