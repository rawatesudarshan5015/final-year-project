import { Collection, Document, ObjectId } from 'mongodb';
import { StudentRole } from '../utils';

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
    role?: StudentRole;
    current_internship?: {
      company_name: string;
      position: string;
      start_date: string;
      description?: string;
    } | null;
    work_history?: CompanyExperience[];
  };
  details?: {
    event_name?: string;
    organized_by?: string;
    venue?: string;
    date?: string;
    time?: string;
    // Alumni referral specific fields
    referral_type?: 'direct_referral' | 'job_opening' | 'startup_hiring';
    company_name?: string;
    position?: string;
    job_type?: 'full_time' | 'internship' | 'contract';
    experience_required?: string;
    skills_required?: string[];
    application_deadline?: string;
    application_link?: string;
    salary_range?: string;
    is_remote?: boolean;
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

// MongoDB Message Schema
export interface MongoMessage {
  _id?: string | ObjectId;
  conversation_id: ObjectId;
  sender_id: number;  // MySQL student ID
  content: string;
  created_at: Date;
  read_by: number[];  // Array of user IDs who have read the message
  sender_name?: string; // Cached sender name for quick display
}

// MongoDB Conversation Schema
export interface MongoConversation {
  _id?: string | ObjectId;
  participants: number[];  // Array of MySQL student IDs
  participant_details?: Array<{
    id: number;
    name: string;
  }>;
  last_message?: {
    content: string;
    sender_id: number;
    created_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}

export interface CompanyExperience {
  company_name: string;
  position: string;
  start_date: string; // ISO format date string
  end_date?: string; // ISO format date string, undefined means current
  is_current: boolean;
  description?: string;
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
  role?: StudentRole;
  // New fields for company information
  current_internship?: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  };
  work_history?: CompanyExperience[];
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
  role?: StudentRole;
  // New fields for company information
  current_internship?: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  };
  work_history?: CompanyExperience[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface ReferralRequest {
  id: number;
  student_id: number;
  alumni_id: number;
  post_id: string;
  message: string;
  resume_url?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
}

export interface MongoDBCollections {
  logs: Collection<Document>;
  uploadLogs: Collection<UploadLog>;
  emailLogs: Collection<EmailLog>;
  posts: Collection<Post>;
  messages: Collection<MongoMessage>;
  interests: Collection<Interest>;
  conversations: Collection<MongoConversation>;
}

export type PostCategory = 'announcement' | 'achievement' | 'event' | 'contest' | 'alumni_referral'; 