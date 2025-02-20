import { Collection, Document, ObjectId } from 'mongodb';

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
  _id?: string | ObjectId;
  id?: number;
  author_id: number;
  category: 'event' | 'project' | 'achievement' | 'announcement' | 'contest' | 'alumni_referral';
  description: string;
  media_url?: string;
  media_type?: 'photo' | 'video';
  created_at: string;
  // Event specific fields
  event_date?: string;
  location?: string;
  // Project specific fields
  tech_stack?: string[];
  github_link?: string;
  // Achievement specific fields
  achievement_type?: string;
  author?: {
    id: number;
    name: string;
    profile_pic_url?: string;
  };
  details?: {
    event_name?: string;
    organized_by?: string;
    venue?: string;
    date?: string;
    time?: string;
    [key: string]: any;
  };
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
  sender_name?: string;
}

export interface Conversation {
  id: number;
  created_at: Date;
  participant_names: string;
  participant_ids: string;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  mobile_number: string;
  branch: string;
  batch_year: number;
  section: string;
  profile_pic_url?: string;
  cloudinary_public_id?: string;
  interests?: {
    [key: string]: string[];
  };
}

export interface Interest {
  _id?: string;
  category: string;
  options: string[];
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  mobile_number?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface MongoDBCollections {
  logs: Collection<Document>;
  uploadLogs: Collection<UploadLog>;
  emailLogs: Collection<EmailLog>;
  posts: Collection<Post>;
  messages: Collection<Message>;
  interests: Collection<Interest>;
}

export type PostCategory = 'announcement' | 'achievement' | 'event' | 'contest' | 'alumni_referral'; 